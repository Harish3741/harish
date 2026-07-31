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

// Session-scoped, not localStorage. Stored for good, the opening showed once
// per browser ever and no visitor after the first saw the front door of the
// place. Per session it plays once for each new arrival, a reload during a
// visit skips it, and closing the tab resets it. Any key skips it regardless,
// so nobody is ever held there.
const VISIT_KEY = 'harish-museum-visited';

export const intro = {
  phase: 'walk',
  t: 0,
  cardAlpha: 0,
  fadeIn: 1,
};

export function shouldSkipIntro() {
  try {
    return sessionStorage.getItem(VISIT_KEY) === '1';
  } catch {
    return false; // private browsing, embedded frames — just play the intro
  }
}

export function markVisited() {
  try {
    sessionStorage.setItem(VISIT_KEY, '1');
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
  centreCamera(player.x, focusY());
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
    // The camera does not move again once the pan has landed. It used to lift
    // to drop the droid into the lower third, which read as the shot jerking
    // back up the moment the card appeared; the card is laid around the droid
    // instead, which is the same framing without moving the camera to get it.
    followCamera(player.x, focusY(), 0.09);
    if (anyPressed() || intro.t > 0.7) {
      intro.phase = 'title';
      intro.t = 0;
    }
    return 'intro';
  }

  if (intro.phase === 'title') {
    intro.cardAlpha = Math.min(1, intro.cardAlpha + dt * 2.4);
    followCamera(player.x, focusY(), 0.06);
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

  // Laid out in fractions of the viewport, which follows the window, and
  // around the droid rather than over it: the title block sits above centre
  // and the prompt below it, leaving the middle of the frame to the droid the
  // camera is centred on.
  const cx = Math.round(view.w / 2);
  const top = Math.round(view.h * 0.20);

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

  // blinking prompt, below the droid
  if (Math.floor(now / 500) % 2 === 0) {
    drawTextCentered(ctx, 'PRESS START', cx, Math.round(view.h * 0.62), {
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
