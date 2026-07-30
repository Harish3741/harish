// The opening: the droid arrives at the museum, walks in through the front
// doors, and only then does the title card drop. Skippable with any key, and
// skipped entirely on a return visit — a cinematic you can't get past is a
// cinematic people come to resent.

import { view, COL } from './config.js';
import { player, walkToward } from './player.js';
import { centreCamera, followCamera, overlay } from './renderer.js';
import { drawTextCentered, textWidth } from './font.js';
import { anyPressed } from './input.js';
import { SITE } from './data/projects.js';

// The arrival walk. Three legs: up the plaza past the fountain, across to the
// doors, then into the atrium. The dogleg exists because the fountain sits on
// the central axis, and walking around it frames the building better than
// marching straight at it would.
const LEGS = [
  { x: 272, y: 676, speed: 92 },   // up the west side of the plaza
  { x: 320, y: 652, speed: 92 },   // across onto the entrance axis
  { x: 320, y: 336, speed: 128 },  // through the hall into the atrium
];
const START = { x: 272, y: 742 };

const VISIT_KEY = 'harish-museum-visited';

// How far above the droid the camera sits while the title card is up.
const CARD_LIFT = 58;

export const intro = {
  phase: 'walk',
  t: 0,
  cardAlpha: 0,
  fadeIn: 1,
  leg: 0,
};

export function shouldSkipIntro() {
  try {
    return localStorage.getItem(VISIT_KEY) === '1';
  } catch {
    return false; // private browsing, embedded frames — just play the intro
  }
}

export function markVisited() {
  try {
    localStorage.setItem(VISIT_KEY, '1');
  } catch {
    /* nothing to do */
  }
}

export function startIntro() {
  intro.phase = 'walk';
  intro.t = 0;
  intro.cardAlpha = 0;
  intro.fadeIn = 1;
  intro.leg = 0;
  player.x = START.x;
  player.y = START.y;
  player.dir = 'up';
  centreCamera(player.x, player.y - 20);
}

/** Jump straight to the title card, leaving the droid in the atrium. */
function cutToTitle() {
  const last = LEGS[LEGS.length - 1];
  player.x = last.x;
  player.y = last.y;
  player.dir = 'up';
  player.moving = false;
  centreCamera(player.x, player.y - CARD_LIFT);
  intro.phase = 'title';
  intro.t = 0;
}

/** @returns {'intro'|'done'} */
export function updateIntro(dt) {
  intro.t += dt;
  intro.fadeIn = Math.max(0, intro.fadeIn - dt * 1.6);

  if (intro.phase === 'walk') {
    if (anyPressed() && intro.fadeIn <= 0) {
      cutToTitle();
      return 'intro';
    }

    const target = LEGS[intro.leg];
    if (walkToward(target.x, target.y, dt, target.speed)) {
      intro.leg += 1;
      if (intro.leg >= LEGS.length) {
        intro.phase = 'settle';
        intro.t = 0;
        player.moving = false;
      }
    }
    followCamera(player.x, player.y - 20, 0.07);
    return 'intro';
  }

  if (intro.phase === 'settle') {
    followCamera(player.x, player.y - CARD_LIFT, 0.09);
    if (anyPressed() || intro.t > 0.7) {
      intro.phase = 'title';
      intro.t = 0;
    }
    return 'intro';
  }

  if (intro.phase === 'title') {
    intro.cardAlpha = Math.min(1, intro.cardAlpha + dt * 2.4);
    // sit the camera high so the droid drops into the lower third, clear of
    // the title rather than behind it
    followCamera(player.x, player.y - CARD_LIFT, 0.06);
    // require the card to be readable before a keypress can dismiss it,
    // otherwise a held key from the skip blows straight through it
    if (intro.cardAlpha >= 1 && intro.t > 0.35 && anyPressed()) {
      intro.phase = 'out';
      intro.t = 0;
      markVisited();
    }
    return 'intro';
  }

  if (intro.phase === 'out') {
    intro.cardAlpha = Math.max(0, intro.cardAlpha - dt * 3.2);
    followCamera(player.x, player.y - 16, 0.1);
    if (intro.cardAlpha <= 0) {
      intro.phase = 'done';
      return 'done';
    }
    return 'intro';
  }

  return 'done';
}

/** Drawn on top of the world, after everything else. */
export function drawIntroOverlay(ctx, now) {
  if (intro.fadeIn > 0) overlay('#1E1712', intro.fadeIn);

  if (intro.phase === 'walk' || intro.phase === 'settle') {
    // a quiet skip hint, once the fade is out of the way
    const a = Math.min(1, Math.max(0, (intro.t - 0.8) * 2));
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a * 0.75;
      drawTextCentered(ctx, 'PRESS ANY KEY TO SKIP', view.w / 2, view.h - 26, {
        color: COL.paper,
        shadow: 'rgba(0,0,0,0.65)',
      });
      ctx.restore();
    }
    return;
  }

  if (intro.cardAlpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = intro.cardAlpha;

  // scrim
  ctx.fillStyle = 'rgba(26, 19, 15, 0.87)';
  ctx.fillRect(0, 0, view.w, view.h);

  // laid out from the middle, since the logical viewport follows the window
  const cx = Math.round(view.w / 2);
  const top = Math.round(view.h * 0.36);

  // brass rules bracketing the name
  const nameW = textWidth(SITE.name) * 4;
  ctx.fillStyle = COL.brass;
  ctx.fillRect(Math.round(cx - nameW / 2) - 10, top - 10, nameW + 20, 1);
  ctx.fillRect(Math.round(cx - nameW / 2) - 10, top + 36, nameW + 20, 1);

  drawTextCentered(ctx, SITE.name, cx, top, {
    color: COL.paper,
    scale: 4,
    shadow: 'rgba(0,0,0,0.5)',
  });

  drawTextCentered(ctx, SITE.tagline, cx, top + 46, { color: COL.brass });

  // blinking prompt
  if (Math.floor(now / 500) % 2 === 0) {
    drawTextCentered(ctx, 'PRESS START', cx, top + 78, {
      color: COL.paper,
      scale: 2,
      shadow: 'rgba(0,0,0,0.5)',
    });
  }

  // one centred line, well clear of the "skip to list" button in the corner
  drawTextCentered(ctx, 'ARROWS OR WASD TO WALK  -  E TO LOOK AT AN EXHIBIT',
    cx, view.h - 26, { color: 'rgba(251,243,228,0.5)' });

  ctx.restore();
}
