// All drawing primitives: the droid's sprite grids, the tile painters, and the
// museum props. Props are drawn procedurally rather than stored as pixel grids
// — architecture is mostly rectangles, and code is far easier to tweak than a
// 28-line string array.

import { COL, DROID_PAL, TILE } from './config.js';

/* ------------------------------------------------------------------ */
/* Sprite grids                                                        */
/* ------------------------------------------------------------------ */

const DROID_DOWN = [
  '................',
  '.......#........',
  '......#O#.......',
  '.......#........',
  '....########....',
  '..##CCCCCCCC##..',
  '.#CCCCCCCCCCCC#.',
  '.#CVVVVVVVVVVC#.',
  '.#CVEVVVVVVEVC#.',
  '.#CVVVVVVVVVVC#.',
  '.#CCCCCCCCCCCC#.',
  '.#OCCCCCCCCCCO#.',
  '..#SCCCCCCCCS#..',
  '...##SSSSSS##...',
  '.....######.....',
  '................',
];

const DROID_UP = [
  '................',
  '.......#........',
  '......#O#.......',
  '.......#........',
  '....########....',
  '..##CCCCCCCC##..',
  '.#CCCCCCCCCCCC#.',
  '.#CCSSSSSSSSCC#.',
  '.#CCSCCCCCCSCC#.',
  '.#CCSSSSSSSSCC#.',
  '.#CCCCCCCCCCCC#.',
  '.#OCCCCCCCCCCO#.',
  '..#SCCCCCCCCS#..',
  '...##SSSSSS##...',
  '.....######.....',
  '................',
];

const DROID_RIGHT = [
  '................',
  '......#.........',
  '.....#O#........',
  '......#.........',
  '...########.....',
  '..##CCCCCCC##...',
  '.#CCCCCCCCCCC#..',
  '.#CCCVVVVVVVC#..',
  '.#CCCVVVVEVVC#..',
  '.#CCCVVVVVVVC#..',
  '.#CCCCCCCCCCC#..',
  '.#OCCCCCCCCCO#..',
  '..#SCCCCCCCS#...',
  '...##SSSSS##....',
  '....######......',
  '................',
];

// Blink frame: the visor goes dark for a couple of frames.
const DROID_DOWN_BLINK = DROID_DOWN.map((row, i) =>
  i === 8 ? '.#CVVVVVVVVVVC#.' : row
);
const DROID_RIGHT_BLINK = DROID_RIGHT.map((row, i) =>
  i === 8 ? '.#CCCVVVVVVVC#..' : row
);

/* ------------------------------------------------------------------ */
/* Grid -> canvas                                                      */
/* ------------------------------------------------------------------ */

function makeSprite(grid, pal, { mirror = false } = {}) {
  const w = grid[0].length;
  const h = grid.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(mirror ? w - 1 - x : x, y, 1, 1);
    }
  }
  return cv;
}

export const SPRITES = {};

export function buildSprites() {
  SPRITES.droid = {
    down: makeSprite(DROID_DOWN, DROID_PAL),
    up: makeSprite(DROID_UP, DROID_PAL),
    right: makeSprite(DROID_RIGHT, DROID_PAL),
    left: makeSprite(DROID_RIGHT, DROID_PAL, { mirror: true }),
    downBlink: makeSprite(DROID_DOWN_BLINK, DROID_PAL),
    rightBlink: makeSprite(DROID_RIGHT_BLINK, DROID_PAL),
    leftBlink: makeSprite(DROID_RIGHT_BLINK, DROID_PAL, { mirror: true }),
  };
}

/* ------------------------------------------------------------------ */
/* Floors                                                              */
/* ------------------------------------------------------------------ */

// Deterministic per-tile jitter, so the "random" grain never changes between
// loads and never needs storing.
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function drawMarble(ctx, px, py, tx, ty) {
  const alt = (tx + ty) % 2 === 0;
  ctx.fillStyle = alt ? COL.marbleA : COL.marbleB;
  ctx.fillRect(px, py, TILE, TILE);

  // grout
  ctx.fillStyle = COL.marbleLine;
  ctx.fillRect(px, py, TILE, 1);
  ctx.fillRect(px, py, 1, TILE);

  // faint veining, on roughly one tile in eight
  const h = hash(tx, ty);
  if (h > 0.88) {
    ctx.fillStyle = 'rgba(206, 190, 164, 0.42)';
    const vy = py + 4 + Math.floor(h * 8);
    ctx.fillRect(px + 3, vy, 5, 1);
    ctx.fillRect(px + 7, vy + 1, 4, 1);
  }
}

/**
 * Parquet: four 8x8 blocks per tile, grain alternating between them. Straight
 * planks read as brick courses at this pixel size — the alternating grain is
 * what makes it legible as a floor.
 */
export function drawWood(ctx, px, py, tx, ty) {
  for (let by = 0; by < 2; by++) {
    for (let bx = 0; bx < 2; bx++) {
      const horiz = ((tx * 2 + bx) + (ty * 2 + by)) % 2 === 0;
      const ox = px + bx * 8;
      const oy = py + by * 8;

      ctx.fillStyle = horiz ? COL.woodA : COL.woodB;
      ctx.fillRect(ox, oy, 8, 8);

      ctx.fillStyle = COL.woodLine;
      if (horiz) {
        ctx.fillRect(ox, oy + 2, 8, 1);
        ctx.fillRect(ox, oy + 5, 8, 1);
      } else {
        ctx.fillRect(ox + 2, oy, 1, 8);
        ctx.fillRect(ox + 5, oy, 1, 8);
      }

      // block seam
      ctx.fillStyle = 'rgba(122, 84, 44, 0.45)';
      ctx.fillRect(ox, oy, 8, 1);
      ctx.fillRect(ox, oy, 1, 8);
    }
  }
}

export function drawStone(ctx, px, py, tx, ty) {
  const h = hash(tx, ty);
  ctx.fillStyle = h > 0.5 ? COL.stoneA : COL.stoneB;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = COL.stoneLine;
  ctx.fillRect(px, py, TILE, 1);
  ctx.fillRect(px, py, 1, TILE);
  if (h > 0.8) {
    ctx.fillStyle = 'rgba(120, 110, 96, 0.35)';
    ctx.fillRect(px + 5, py + 6, 3, 1);
  }
}

export function drawGrass(ctx, px, py, tx, ty) {
  ctx.fillStyle = COL.grass;
  ctx.fillRect(px, py, TILE, TILE);
  const h = hash(tx * 3, ty * 7);
  ctx.fillStyle = COL.grassDark;
  ctx.fillRect(px + Math.floor(h * 12), py + Math.floor(hash(ty, tx) * 12), 2, 1);
  ctx.fillRect(px + Math.floor(hash(tx + 1, ty) * 12), py + Math.floor(h * 12), 1, 2);
}

/* ------------------------------------------------------------------ */
/* Walls                                                               */
/* ------------------------------------------------------------------ */

/**
 * The top of a wall, seen from above: coursed stone. Kept deliberately low
 * contrast — this is the largest surface on screen in some rooms, and loud
 * masonry pulls the eye away from the exhibits.
 */
export function drawWallTop(ctx, px, py, tx, ty) {
  ctx.fillStyle = COL.wallTop;
  ctx.fillRect(px, py, TILE, TILE);

  // two courses per tile, staggered so the joints break
  const stagger = (ty % 2) * 8;
  ctx.fillStyle = 'rgba(94, 74, 54, 0.45)';
  ctx.fillRect(px, py, TILE, 1);
  ctx.fillRect(px, py + 8, TILE, 1);
  ctx.fillRect(px + stagger, py, 1, 8);
  ctx.fillRect(px + ((stagger + 8) % TILE), py + 8, 1, 8);

  ctx.fillStyle = 'rgba(163, 140, 107, 0.4)';
  ctx.fillRect(px, py + 1, TILE, 1);
  ctx.fillRect(px, py + 9, TILE, 1);
}

/**
 * A circular inlay set into the atrium floor, under the skylight. Drawn per
 * pixel from the radius, which is the only way to get a clean pixel circle
 * without hand-plotting one.
 */
export function drawInlay(ctx, cx, cy, r) {
  // darker stones than the surrounding marble, so the medallion reads as inlaid
  // rather than as another pool of light
  const FIELD_A = '#D9C7A9';
  const FIELD_B = '#CDB99A';
  const CORE = '#8E7A5C';

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;

      let col;
      if (d > r - 2) col = COL.brassDim;
      else if (d > r - 4) col = COL.brass;
      else if (d > r - 6) col = COL.marbleLine;
      else if (d > r * 0.40) col = (Math.floor((dx + dy) / 5) & 1) ? FIELD_B : FIELD_A;
      else if (d > r * 0.34) col = COL.brass;
      else if (d > r * 0.14) col = FIELD_B;
      else col = CORE;

      ctx.fillStyle = col;
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }

  // four brass spokes, so it reads as a compass rather than a target
  ctx.fillStyle = COL.brass;
  for (let i = Math.round(r * 0.40); i < r - 5; i++) {
    ctx.fillRect(cx + i, cy, 1, 1);
    ctx.fillRect(cx - i, cy, 1, 1);
    ctx.fillRect(cx, cy + i, 1, 1);
    ctx.fillRect(cx, cy - i, 1, 1);
  }
}

/** The front of a wall: plaster above, wainscot panelling below. */
export function drawWallFace(ctx, px, py) {
  ctx.fillStyle = COL.wallFace;
  ctx.fillRect(px, py, TILE, TILE);

  // cornice
  ctx.fillStyle = COL.wallTop;
  ctx.fillRect(px, py, TILE, 3);
  ctx.fillStyle = COL.wallTopHi;
  ctx.fillRect(px, py, TILE, 1);

  // picture rail
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(px, py + 4, TILE, 1);

  // baseboard
  ctx.fillStyle = COL.baseboard;
  ctx.fillRect(px, py + TILE - 3, TILE, 3);
  ctx.fillStyle = COL.wallLine;
  ctx.fillRect(px, py + TILE - 1, TILE, 1);
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

/**
 * A display plinth with a glass case. This is the thing you press E at.
 * Drawn from its base: (px, py) is the bottom-centre.
 */
export function drawPlinth(ctx, px, py) {
  const x = px - 10;

  // contact shadow
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(x - 1, py - 2, 22, 3);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.14)';
  ctx.fillRect(x - 3, py - 1, 26, 1);

  // plinth body, lit from the left
  ctx.fillStyle = COL.wallFace;
  ctx.fillRect(x + 2, py - 15, 16, 14);
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(x + 2, py - 15, 6, 14);
  ctx.fillStyle = COL.baseboard;
  ctx.fillRect(x + 2, py - 4, 16, 3);
  ctx.fillStyle = COL.wallLine;
  ctx.fillRect(x + 2, py - 1, 16, 1);
  ctx.fillRect(x + 2, py - 15, 16, 1);

  // engraved brass plaque on the front
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x + 6, py - 11, 9, 4);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x + 6, py - 11, 9, 1);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.55)';
  ctx.fillRect(x + 7, py - 9, 7, 1);

  // brass rail the case sits on
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x, py - 18, 20, 3);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x, py - 16, 20, 1);

  // glass case
  ctx.fillStyle = 'rgba(191, 227, 232, 0.16)';
  ctx.fillRect(x + 3, py - 34, 14, 16);
  ctx.fillStyle = 'rgba(191, 227, 232, 0.55)';
  ctx.fillRect(x + 2, py - 35, 16, 1);
  ctx.fillRect(x + 2, py - 35, 1, 17);
  ctx.fillRect(x + 17, py - 35, 1, 17);
  // corner posts catch the light
  ctx.fillStyle = COL.glass;
  ctx.fillRect(x + 2, py - 35, 1, 4);
  ctx.fillRect(x + 17, py - 35, 1, 4);
  // glare across the front pane
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.fillRect(x + 5, py - 31, 1, 9);
  ctx.fillRect(x + 6, py - 31, 1, 5);
}

/** The icon hovering inside a plinth's case. Animated, so drawn per frame. */
export function drawPlinthIcon(ctx, px, py, kind, t) {
  const bob = Math.round(Math.sin(t / 520) * 1.5);
  const cx = px;
  const cy = py - 25 + bob;

  ctx.fillStyle = 'rgba(220, 166, 70, 0.20)';
  ctx.fillRect(cx - 6, cy - 6, 12, 12);

  ctx.fillStyle = COL.brass;
  if (kind === 'automations') {
    // a cog
    ctx.fillRect(cx - 4, cy - 2, 8, 4);
    ctx.fillRect(cx - 2, cy - 4, 4, 8);
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
    ctx.fillStyle = COL.wallFace;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  } else if (kind === 'personal') {
    // a star
    ctx.fillRect(cx - 1, cy - 5, 2, 10);
    ctx.fillRect(cx - 5, cy - 1, 10, 2);
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
    ctx.fillStyle = COL.paper;
    ctx.fillRect(cx - 1, cy - 2, 2, 2);
  } else if (kind === 'client') {
    // a briefcase
    ctx.fillRect(cx - 5, cy - 2, 10, 7);
    ctx.fillRect(cx - 2, cy - 5, 4, 2);
    ctx.fillStyle = COL.brassDim;
    ctx.fillRect(cx - 5, cy, 10, 1);
    ctx.fillStyle = COL.paper;
    ctx.fillRect(cx - 1, cy, 2, 2);
  } else {
    // a portrait bust
    ctx.fillRect(cx - 2, cy - 5, 4, 4);
    ctx.fillRect(cx - 4, cy, 8, 5);
    ctx.fillStyle = COL.brassDim;
    ctx.fillRect(cx - 5, cy + 4, 10, 2);
  }
}

/** A framed picture hung on a wall face. */
export function drawFrame(ctx, px, py, seed) {
  const h = hash(seed, 3);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px, py, 14, 11);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px, py, 14, 1);
  ctx.fillRect(px, py, 1, 11);

  // canvas inside
  const inks = ['#8E6FA8', '#5D8FA8', '#A8785D', '#6B9A73', '#A85D6B'];
  ctx.fillStyle = inks[Math.floor(h * inks.length) % inks.length];
  ctx.fillRect(px + 2, py + 2, 10, 7);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(px + 3, py + 3, 8, 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(px + 3, py + 7, 8, 1);
}

/** A potted plant. (px, py) is the bottom-centre. */
export function drawPlant(ctx, px, py) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 5, py - 2, 10, 2);

  ctx.fillStyle = COL.pot;
  ctx.fillRect(px - 4, py - 8, 8, 7);
  ctx.fillStyle = COL.potDark;
  ctx.fillRect(px - 4, py - 8, 8, 1);
  ctx.fillRect(px - 4, py - 2, 8, 1);

  ctx.fillStyle = COL.plantB;
  ctx.fillRect(px - 5, py - 15, 10, 7);
  ctx.fillStyle = COL.plantA;
  ctx.fillRect(px - 4, py - 17, 8, 7);
  ctx.fillRect(px - 6, py - 13, 3, 3);
  ctx.fillRect(px + 3, py - 14, 3, 3);
}

/** A gallery bench. (px, py) is the bottom-centre. */
export function drawBench(ctx, px, py) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 11, py - 2, 22, 2);
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(px - 9, py - 5, 3, 5);
  ctx.fillRect(px + 6, py - 5, 3, 5);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(px - 11, py - 9, 22, 4);
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(px - 11, py - 6, 22, 1);
}

function stanchionPost(ctx, px, py) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 4, py - 2, 8, 2);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px - 3, py - 4, 6, 2);
  ctx.fillRect(px - 1, py - 15, 2, 11);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px - 1, py - 15, 1, 11);
  ctx.fillRect(px - 2, py - 18, 4, 3);
}

/**
 * A run of velvet rope: two posts with a rope sagging between them.
 * (px, py) is the bottom-centre of the left post; `span` is the gap in pixels.
 */
export function drawRopeLine(ctx, px, py, span) {
  stanchionPost(ctx, px, py);
  stanchionPost(ctx, px + span, py);

  // the sag, approximated in 2px steps so it stays on the pixel grid
  const top = py - 16;
  for (let i = 2; i < span - 1; i += 2) {
    const t = i / span;
    const sag = Math.round(Math.sin(t * Math.PI) * 5);
    ctx.fillStyle = COL.velvet;
    ctx.fillRect(px + i, top + sag, 2, 2);
    ctx.fillStyle = COL.velvetDark;
    ctx.fillRect(px + i, top + sag + 2, 2, 1);
  }
}

/**
 * A wayfinding placard. Text is drawn separately by the caller; the arrow says
 * which way the wing is, which is the only reason the sign exists.
 */
export function drawSign(ctx, px, py, w, arrow) {
  const x = px - Math.floor(w / 2);

  // post
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px - 1, py + 11, 2, 5);
  ctx.fillRect(px - 3, py + 15, 6, 2);

  // board
  ctx.fillStyle = COL.ink;
  ctx.fillRect(x, py, w, 11);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x, py, w, 1);
  ctx.fillRect(x, py + 10, w, 1);
  ctx.fillRect(x, py, 1, 11);
  ctx.fillRect(x + w - 1, py, 1, 11);

  if (!arrow) return;

  // a 7px triangle, tucked inside the left edge of the board
  const ax = x + 5;
  const ay = py + 5;
  ctx.fillStyle = COL.brass;
  for (let i = 0; i < 4; i++) {
    const span = 1 + i * 2;
    const dy = arrow === 'up' ? -3 + i : 3 - i;
    ctx.fillRect(ax - Math.floor(span / 2), ay + dy, span, 1);
  }
}

/**
 * The museum's front doors, standing open. The threshold between them is
 * walkable floor, so the doors themselves are drawn swung back against the
 * facade on either side. (px, py) is the top-left of the whole 64px portal.
 */
export function drawFrontDoors(ctx, px, py) {
  // stone surround
  ctx.fillStyle = COL.stoneB;
  ctx.fillRect(px, py, 64, 28);
  ctx.fillStyle = COL.stoneA;
  ctx.fillRect(px + 2, py + 2, 60, 2);

  // lintel with a brass band
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px + 8, py + 5, 48, 3);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px + 8, py + 7, 48, 1);

  // the opening: warm light spilling out of the lobby
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(px + 14, py + 9, 36, 19);
  ctx.fillStyle = 'rgba(255, 226, 168, 0.30)';
  ctx.fillRect(px + 18, py + 11, 28, 17);

  // door panels, swung open flat against the wall
  for (const dx of [px + 6, px + 44]) {
    ctx.fillStyle = COL.woodDark;
    ctx.fillRect(dx, py + 9, 14, 19);
    ctx.fillStyle = COL.wood;
    ctx.fillRect(dx + 1, py + 10, 12, 17);
    ctx.fillStyle = COL.woodDark;
    ctx.fillRect(dx + 3, py + 12, 8, 1);
    ctx.fillRect(dx + 3, py + 22, 8, 1);
    ctx.fillStyle = COL.brass;
    ctx.fillRect(dx + (dx < px + 20 ? 11 : 2), py + 18, 2, 3);
  }
}

/** Wide stone steps leading up to the doors. */
export function drawSteps(ctx, px, py, w) {
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 ? COL.stoneA : COL.stoneB;
    ctx.fillRect(px - i * 4, py + i * 4, w + i * 8, 4);
    ctx.fillStyle = COL.stoneLine;
    ctx.fillRect(px - i * 4, py + i * 4, w + i * 8, 1);
  }
}

/**
 * A pool of light on the floor, as if from a skylight. Built from stepped,
 * corner-cut rectangles so it reads as a soft pool rather than a lit rectangle
 * — no gradients, which would break the pixel grid.
 */
export function drawLightPool(ctx, px, py, w, h, intensity = 1) {
  const steps = 6;
  for (let i = steps - 1; i >= 0; i--) {
    const inset = i * 3;
    const cut = 6 + i * 2;
    const a = (0.035 + (steps - i) * 0.016) * intensity;
    ctx.fillStyle = `rgba(255, 240, 202, ${a})`;
    ctx.fillRect(px + inset, py + inset + cut, w - inset * 2, h - inset * 2 - cut * 2);
    ctx.fillRect(px + inset + cut, py + inset, w - inset * 2 - cut * 2, h - inset * 2);
  }
}

/** The contact shadow under the hovering droid. */
export function drawDroidShadow(ctx, cx, baseY, lift) {
  const w = Math.max(4, 9 - lift);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.26)';
  ctx.fillRect(cx - w, baseY, w * 2, 2);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.15)';
  ctx.fillRect(cx - w + 2, baseY + 2, w * 2 - 4, 1);
}
