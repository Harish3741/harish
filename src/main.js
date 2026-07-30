// Boot, scene machine, game loop.
//
// Scenes are deliberately few: the opening cinematic runs, then you walk
// around, and the exhibit menu is a DOM overlay layered on top rather than a
// scene of its own.

import { view, COL } from './config.js';
import { buildSprites } from './art.js';
import {
  buildMap, map, plinthNear, interactableNear, drawProp, drawSconces, START_PX,
} from './map.js';
import { initRenderer, ctx, camX, camY, centreCamera, followCamera, vignette } from './renderer.js';
import {
  initInput, moveAxis, interactPressed, anyPressed, endFrame, watchPointer,
  clearHeldKeys,
} from './input.js';
import {
  player, spawnAt, movePlayer, updatePlayer, drawPlayer, focusY, toggleSeat, rouse,
} from './player.js';
import { initMenu, openMenu, openArtwork, isMenuOpen, closeMenu } from './menu.js';
import { initListView, isListOpen } from './listview.js';
import {
  startIntro, updateIntro, drawIntroOverlay, shouldSkipIntro, markVisited,
} from './intro.js';
import { drawTextCentered, textWidth } from './font.js';

let state = 'intro';
let last = 0;
let promptPulse = 0;
let lastNear = null;

/* ------------------------------------------------------------------ */

// A coarse pointer with no hover is the honest signal for "phone or tablet".
// Width alone is not: a desktop window docked to half a screen, or the page
// running inside a panel, still has a keyboard and should still get the game.
// The width check is only a floor, for windows too small to play in at all.
function isHandheld() {
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  return coarse || window.innerWidth < 620;
}

function boot() {
  const canvas = document.getElementById('game');

  if (isHandheld()) {
    // No game on a phone: a thumb is a bad D-pad. Serve the same content flat.
    document.body.classList.add('is-handheld');
    initListView({ standalone: true });
    return;
  }

  buildSprites();
  buildMap();
  initRenderer(canvas);
  initInput();
  watchPointer(canvas);
  initMenu();
  initListView();

  document.body.classList.add('is-playing');

  // You always begin in the middle of the atrium, on the medallion.
  spawnAt(START_PX.x, START_PX.y, 'down');

  if (shouldSkipIntro()) {
    centreCamera(player.x, focusY());
    state = 'explore';
    markVisited();
  } else {
    startIntro();
    state = 'intro';
  }

  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ */

function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;

  update(dt, ts);
  draw(ts);
  endFrame();

  requestAnimationFrame(loop);
}

function update(dt, ts) {
  // the overlays own the keyboard while they're up
  if (isMenuOpen() || isListOpen()) {
    updatePlayer(dt, false);
    return;
  }

  updatePlayer(dt, state === 'explore');

  if (state === 'intro') {
    if (updateIntro(dt) === 'done') state = 'explore';
    return;
  }

  const axis = moveAxis();
  const pressed = interactPressed();
  // anyPressed, not the axis: a quick tap can go down and up inside one frame,
  // and the held-key set would be empty again by the time we look at it.
  if (anyPressed()) rouse();

  // Getting up is the same key as sitting down, and moving stands you up too.
  if (player.seat) {
    if (axis.x || axis.y) toggleSeat(player.seat);
    else player.moving = false;
  } else {
    movePlayer(axis.x, axis.y, dt);
  }

  followCamera(player.x, focusY(), 0.14);

  const near = interactableNear(player.x, player.y);
  promptPulse = near ? Math.min(1, promptPulse + dt * 7) : Math.max(0, promptPulse - dt * 9);
  if (near) lastNear = near;

  if (near && pressed) {
    if (near.id) {
      clearHeldKeys();
      // drop any keys held while the menu was up, or the droid bolts on close
      openMenu(near.id, clearHeldKeys);
    } else if (near.caption !== undefined) {
      clearHeldKeys();
      openArtwork(near, clearHeldKeys);
    } else {
      toggleSeat(near);
    }
  }
}

/* ------------------------------------------------------------------ */

function draw(ts) {
  const ox = camX();
  const oy = camY();

  ctx.fillStyle = COL.sky;
  ctx.fillRect(0, 0, view.w, view.h);

  // the world, blitted from the pre-rendered map canvas
  ctx.drawImage(map.canvas, ox, oy, view.w, view.h, 0, 0, view.w, view.h);

  // torches are drawn live so their flames move, and always behind everything
  // that stands on the floor — they are on the wall
  drawSconces(ctx, ox, oy, ts);

  // props and the droid, interleaved by depth so you can walk behind things
  const props = map.props;
  let i = 0;
  for (; i < props.length && props[i].y <= player.y; i++) {
    if (visible(props[i], ox, oy)) drawProp(ctx, props[i], ox, oy, ts);
  }

  drawPlayer(ctx, ox, oy);

  for (; i < props.length; i++) {
    if (visible(props[i], ox, oy)) drawProp(ctx, props[i], ox, oy, ts);
  }

  vignette();

  if (state === 'explore') drawPrompt(ts, ox, oy);

  if (state === 'intro') drawIntroOverlay(ctx, ts);
}

// Generous margin: some props (the velvet rope runs) extend well to the right
// of their anchor point, and popping in at the screen edge is worse than
// drawing a few extra rectangles.
function visible(p, ox, oy) {
  const x = p.x - ox;
  const y = p.y - oy;
  return x > -140 && x < view.w + 140 && y > -60 && y < view.h + 60;
}

/** The "press E" bubble that floats over a plinth when you're close enough. */
function drawPrompt(ts, ox, oy) {
  if (promptPulse <= 0.01) return;
  const near = interactableNear(player.x, player.y) || lastNear;
  if (!near) return;

  const label = near.label.toUpperCase();
  const hint = near.id ? 'PRESS  E'
    : near.caption !== undefined ? 'PRESS  E  TO  READ'
      : player.seat ? 'PRESS  E  TO  STAND' : 'PRESS  E  TO  SIT';
  const w = Math.max(textWidth(label), textWidth(hint)) + 12;
  const x = Math.round(near.x - ox);
  const bob = Math.round(Math.sin(ts / 400) * 1.5);
  const y = Math.round(near.y - oy) - (near.id ? 60 : 34) + bob;

  ctx.save();
  ctx.globalAlpha = promptPulse;

  // bubble
  ctx.fillStyle = 'rgba(30, 23, 18, 0.88)';
  ctx.fillRect(x - w / 2, y, w, 21);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x - w / 2, y, w, 1);
  ctx.fillRect(x - w / 2, y + 20, w, 1);
  ctx.fillRect(x - w / 2, y, 1, 21);
  ctx.fillRect(x + w / 2 - 1, y, 1, 21);
  // tail
  ctx.fillStyle = 'rgba(30, 23, 18, 0.88)';
  ctx.fillRect(x - 2, y + 21, 4, 2);
  ctx.fillRect(x - 1, y + 23, 2, 2);

  drawTextCentered(ctx, label, x, y + 4, { color: COL.paper });
  drawTextCentered(ctx, hint, x, y + 12, { color: COL.brass });

  ctx.restore();
}

/* ------------------------------------------------------------------ */

// Esc from anywhere in the game closes whatever is open.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen()) closeMenu();
});

boot();
