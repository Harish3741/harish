// Headings set in the museum's own pixels.
//
// The rule elsewhere is that anything inside the game canvas uses the 5x7
// bitmap font and anything in a DOM overlay uses real text, so titles and links
// stay selectable and readable by a screen reader. A heading is the one place
// that rule costs something: the plain list is the whole site on a phone, and
// a system serif at the top of it makes the list read as a different website
// from the museum you just tapped your way out of.
//
// So a heading is engraved: a canvas drawn with the same font as the banners
// hanging over the doorways, with the real words on a visually-hidden element
// next to it. Nothing else is drawn this way — a paragraph in a 5x7 font is a
// paragraph nobody reads.

import { drawText, textWidth, CHAR_H } from './font.js';

/**
 * Draw `text` into `canvas` at the largest whole pixel scale that fits.
 *
 * The scale is whole in *device* pixels rather than CSS ones. A phone is 2x or
 * 3x, so a scale of 4 device pixels is 1.33 CSS pixels per drawn pixel — which
 * is both crisp on the glass and near enough to filling the width. Rounding to
 * whole CSS pixels instead would leave a heading at half the size it could be.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} text
 * @param {object} [opts] cap  — the tallest the glyphs may get, in CSS pixels
 * @returns {number} the scale it settled on, in device pixels
 */
export function engrave(canvas, text, opts = {}) {
  const { cap = 40, color = '#F3E8D6', shadow = null, tracking = 1 } = opts;
  const str = String(text || '');
  const glyphs = textWidth(str, tracking);
  if (!glyphs) return 0;

  const parent = canvas.parentElement;
  const avail = opts.width || (parent && parent.clientWidth) || 320;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  let scale = Math.min(
    Math.floor((avail * dpr) / glyphs),
    Math.floor((cap / CHAR_H) * dpr)
  );
  if (scale < 1) scale = 1;

  // One extra row for the drop shadow, which drawText offsets by one pixel.
  canvas.width = glyphs * scale;
  canvas.height = (CHAR_H + 1) * scale;
  canvas.style.width = `${canvas.width / dpr}px`;
  canvas.style.height = `${canvas.height / dpr}px`;

  const c = canvas.getContext('2d');
  c.setTransform(scale, 0, 0, scale, 0, 0);
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, glyphs, CHAR_H + 1);
  drawText(c, str, 0, 0, { color, shadow, tracking, scale: 1 });

  return scale;
}
