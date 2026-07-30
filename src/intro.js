// The opening: the droid arrives at the museum, walks in through the front
// doors, and only then does the title card drop. Skippable with any key, and
// skipped entirely on a return visit — a cinematic you can't get past is a
// cinematic people come to resent.

import { view, COL } from './config.js';
import { player, focusY, FOCUS_DY } from './player.js';
import { START_PX } from './map.js';
import { centreCamera, followCamera, overlay } from './renderer.js';
import { drawTextCentered, textWidth } from './font.js';
import { anyPressed } from './input.js';
import { SITE } from './data/projects.js';

// There is no outside any more, so there is no arrival walk. Instead the
// camera opens high on the north arches — where the two banners are — and
// drifts down to the droid standing on the medallion, then the title lands.
// The end of the pan is wherever the droid is standing, taken from the map
// rather than written down here — the atrium has been resized twice and a
// hand-typed number goes stale silently, leaving the camera short of the droid.
const PAN_FROM = { x: 320, y: 128 };
const PAN_TO = { x: START_PX.x, y: START_PX.y - FOCUS_DY };
const PAN_SECONDS = 2.2;

const VISIT_KEY = 'harish-museum-visited';

// How far above the droid the camera sits while the title card is up.
const CARD_LIFT = 58;

export const intro = {
  phase: 'walk',
  t: 0,
  cardAlpha: 0,
  fadeIn: 1,
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
  intro.phase = 'pan';
  intro.t = 0;
  intro.cardAlpha = 0;
  intro.fadeIn = 1;
  player.dir = 'up';
  player.moving = false;
  centreCamera(PAN_FROM.x, PAN_FROM.y);
}

/** Jump straight to the title card. */
function cutToTitle() {
  centreCamera(player.x, focusY() - CARD_LIFT);
  intro.phase = 'title';
  intro.t = 0;
}

/** @returns {'intro'|'done'} */
export function updateIntro(dt) {
  intro.t += dt;
  intro.fadeIn = Math.max(0, intro.fadeIn - dt * 1.6);

  if (intro.phase === 'pan') {
    if (anyPressed() && intro.fadeIn <= 0) {
      cutToTitle();
      return 'intro';
    }
    // ease-out, so the camera arrives gently rather than stopping dead
    const k = Math.min(1, intro.t / PAN_SECONDS);
    const e = 1 - (1 - k) * (1 - k);
    centreCamera(PAN_FROM.x, PAN_FROM.y + (PAN_TO.y - PAN_FROM.y) * e);
    if (k >= 1) {
      intro.phase = 'settle';
      intro.t = 0;
    }
    return 'intro';
  }

  if (intro.phase === 'settle') {
    followCamera(player.x, focusY() - CARD_LIFT, 0.09);
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
    followCamera(player.x, focusY() - CARD_LIFT, 0.06);
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
    followCamera(player.x, focusY(), 0.12);
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

  if (intro.phase === 'pan' || intro.phase === 'settle') {
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
