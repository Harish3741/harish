// Canvas setup and the camera.
//
// The pixel scale is always a whole number — a fractional scale would smear the
// art no matter how smoothing is configured. Rather than fix the logical
// resolution and letterbox, the scale is chosen for the window and the logical
// viewport is then sized to fill it. A larger window therefore shows more of
// the museum at the same pixel size, which is what you actually want from a
// top-down game.

import { view, MAX_VIEW_W, MAX_VIEW_H, TILE } from './config.js';
import { MAP_W, MAP_H } from './map.js';

export const camera = { x: 0, y: 0 };

let canvas = null;
export let ctx = null;
export let scale = 3;

export function initRenderer(el) {
  canvas = el;
  ctx = canvas.getContext('2d', { alpha: false });
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // smallest whole scale that keeps the logical view inside its bounds
  scale = Math.max(2, Math.ceil(w / MAX_VIEW_W), Math.ceil(h / MAX_VIEW_H));

  // Even, so half a viewport is a whole number of pixels. The camera centres on
  // the droid by subtracting exactly that, and on an odd width the half-pixel
  // left over rounds differently depending on where the droid happens to be —
  // which is a one-pixel wobble under the sprite the whole time it walks.
  view.w = Math.ceil(w / scale / 2) * 2;
  view.h = Math.ceil(h / scale / 2) * 2;

  canvas.width = view.w * scale;
  canvas.height = view.h * scale;
  canvas.style.width = `${view.w * scale}px`;
  canvas.style.height = `${view.h * scale}px`;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

const maxCamX = () => Math.max(0, MAP_W * TILE - view.w);
const maxCamY = () => Math.max(0, MAP_H * TILE - view.h);

/** Snap the camera straight onto a point, clamped to the map. */
export function centreCamera(x, y) {
  camera.x = clamp(Math.round(x - view.w / 2), 0, maxCamX());
  camera.y = clamp(Math.round(y - view.h / 2), 0, maxCamY());
}

/**
 * Ease the camera toward a point. `k` is roughly "fraction closed per frame".
 *
 * For the cinematic only. It must not be used to follow the droid while you
 * walk: the camera position is fractional here and rounded at draw time, so it
 * crosses pixel boundaries on a different beat from the droid's own position.
 * The two roundings disagree by a pixel several times a second, and the sprite
 * shivers against a world that is scrolling perfectly smoothly — worst on a
 * diagonal, where it happens on both axes at once. Following the droid is
 * centreCamera's job, which rounds once and pins it.
 */
export function followCamera(x, y, k = 0.12) {
  const tx = clamp(x - view.w / 2, 0, maxCamX());
  const ty = clamp(y - view.h / 2, 0, maxCamY());
  camera.x += (tx - camera.x) * k;
  camera.y += (ty - camera.y) * k;
}

export const camX = () => Math.round(camera.x);
export const camY = () => Math.round(camera.y);

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Full-screen tint, used for fades. */
export function overlay(color, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.restore();
}

/** A soft vignette, so the edges of the screen fall away a little. */
export function vignette() {
  const g = ctx.createRadialGradient(
    view.w / 2, view.h / 2, view.h * 0.38,
    view.w / 2, view.h / 2, view.w * 0.75
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(28, 18, 12, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
}
