// All drawing primitives: the droid's sprite grids, the tile painters, and the
// museum props. Props are drawn procedurally rather than stored as pixel grids
// — architecture is mostly rectangles, and code is far easier to tweak than a
// 28-line string array.

import { COL, DROID_PAL, THEATRE, TILE } from './config.js';

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

// A general standing person. Deliberately generic for now: the palette lives
// in data/projects.js so hair, skin and clothes can be changed without touching
// the sprite.
const PERSON = [
  '................',
  '.....######.....',
  '....########....',
  '...#KKKKKKKK#...',
  '...#KKKKKKKK#...',
  '...#KSSSSSSK#...',
  '...#SSSSSSSS#...',
  '...#SESSSSES#...',
  '...#SSS##SSS#...',
  '....########....',
  '..##TTTTTTTT##..',
  '.#STTTTTTTTTTS#.',
  '.#STTTTTTTTTTS#.',
  '..#TTTTTTTTTT#..',
  '..#PPPP##PPPP#..',
  '...#PPP##PPP#...',
  '...#OOO##OOO#...',
];

// Hair past the ears, so a room of people isn't a room of the same person in
// different colours. Rows 6-8 are the face; the outer column either side of it
// becomes hair, and it falls onto the shoulders at row 9.
const PERSON_LONG = PERSON.map((row, i) => {
  if (i === 6) return '...#KSSSSSSK#...';
  if (i === 7) return '...#KESSSSEK#...';
  if (i === 8) return '...#KSS##SSK#...';
  if (i === 9) return '...#KK####KK#...';
  return row;
});

// eyes closed, for the idle blink
const PERSON_BLINK = PERSON.map((row, i) => (i === 7 ? '...#SS####SS#...' : row));
const PERSON_LONG_BLINK = PERSON_LONG.map((row, i) => (i === 7 ? '...#KS####SK#...' : row));

const PERSON_GRIDS = {
  short: [PERSON, PERSON_BLINK],
  long: [PERSON_LONG, PERSON_LONG_BLINK],
};

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

const PERSON_PAL = {
  '#': '#2A1B1C', K: '#2E2018', S: '#C98F63', E: '#241A15',
  T: '#7A2A31', P: '#2E2A38', O: '#1E1A18',
};

/**
 * `cast` is { id: { hair, palette } } — everyone in the building who isn't the
 * droid. Each one gets their own pair of frames baked at load, because a sprite
 * recoloured per draw would mean a canvas operation per person per frame.
 * A partial palette is fine: anything missing falls back to the default.
 */
export function buildSprites(cast) {
  SPRITES.people = {};
  const entries = Object.entries(cast || {});
  if (!entries.length) entries.push(['default', {}]);
  for (const [id, who] of entries) {
    const pal = { ...PERSON_PAL, ...((who && who.palette) || {}) };
    const [idle, blink] = PERSON_GRIDS[(who && who.hair) || 'short'] || PERSON_GRIDS.short;
    SPRITES.people[id] = { idle: makeSprite(idle, pal), blink: makeSprite(blink, pal) };
  }

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

/**
 * Commercial carpet tile, for the boardroom. Laid the way it is in every office
 * in the world: square tiles, each one quarter-turned against its neighbour, so
 * the pile catches the light in alternating directions and the grid only just
 * shows. Cool grey-blue, to sit under the navy rug rather than fight it.
 */
export function drawCarpetTile(ctx, px, py, tx, ty) {
  const turned = (tx + ty) % 2 === 0;
  ctx.fillStyle = turned ? '#6C7480' : '#67707B';
  ctx.fillRect(px, py, TILE, TILE);

  // pile, running one way on this tile and the other way on the next
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let i = 1; i < TILE; i += 3) {
    if (turned) ctx.fillRect(px + i, py, 1, TILE);
    else ctx.fillRect(px, py + i, TILE, 1);
  }
  ctx.fillStyle = 'rgba(20, 24, 30, 0.14)';
  for (let i = 2; i < TILE; i += 6) {
    if (turned) ctx.fillRect(px + i, py, 1, TILE);
    else ctx.fillRect(px, py + i, TILE, 1);
  }

  // the seam between tiles, barely there
  ctx.fillStyle = 'rgba(20, 24, 30, 0.18)';
  ctx.fillRect(px, py, TILE, 1);
  ctx.fillRect(px, py, 1, TILE);

  // a fleck or two of the darker fibre in the weave
  const h = hash(tx * 5, ty * 3);
  if (h > 0.72) {
    ctx.fillStyle = 'rgba(20, 24, 30, 0.22)';
    ctx.fillRect(px + Math.floor(h * 11) + 2, py + Math.floor(h * 9) + 3, 2, 1);
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

/** Theatre carpet: deep red, with a woven diamond that only just shows. */
export function drawCarpet(ctx, px, py, tx, ty) {
  ctx.fillStyle = (tx + ty) % 2 === 0 ? THEATRE.carpetA : THEATRE.carpetB;
  ctx.fillRect(px, py, TILE, TILE);

  ctx.fillStyle = 'rgba(255, 210, 190, 0.035)';
  for (let j = 0; j < TILE; j += 4) {
    for (let i = 0; i < TILE; i += 4) {
      if (((i + j) >> 2) % 2 === 0) ctx.fillRect(px + i, py + j, 2, 2);
    }
  }
  ctx.fillStyle = THEATRE.carpetLine;
  ctx.fillRect(px, py, TILE, 1);
  ctx.fillRect(px, py, 1, TILE);
}

/* ------------------------------------------------------------------ */
/* Walls                                                               */
/* ------------------------------------------------------------------ */

/**
 * The top of a wall, seen from above. This is the largest surface on screen in
 * some rooms, so it is deliberately quiet: big ashlar blocks, low contrast, no
 * fine detail to pull the eye off the exhibits.
 */
export function drawWallTop(ctx, px, py, tx, ty) {
  const h = hash(tx >> 1, ty >> 1);
  ctx.fillStyle = COL.wallTop;
  ctx.fillRect(px, py, TILE, TILE);

  // faint per-block tonal drift, so the mass isn't a flat field
  ctx.fillStyle = h > 0.5
    ? 'rgba(255, 246, 226, 0.045)'
    : 'rgba(48, 34, 22, 0.05)';
  ctx.fillRect(px, py, TILE, TILE);

  // joints every two tiles, staggered by row
  const stagger = ((ty >> 1) % 2) * TILE;
  ctx.fillStyle = 'rgba(74, 56, 38, 0.30)';
  if (ty % 2 === 0) ctx.fillRect(px, py, TILE, 1);
  if ((px + stagger) % (TILE * 2) === 0) ctx.fillRect(px, py, 1, TILE);

  ctx.fillStyle = 'rgba(186, 162, 128, 0.16)';
  if (ty % 2 === 0) ctx.fillRect(px, py + 1, TILE, 1);
}

/**
 * The front of a wall, seen face-on. Walls are three tiles tall, and `depth`
 * says which band this tile is: 0 sits on the floor, 2 meets the ceiling. That
 * gives a real dado / picture field / cornice elevation instead of a single
 * flat strip, which is most of what makes a room read as a room.
 */
export function drawWallFace(ctx, px, py, depth, theme) {
  const T = theme === 'theatre' ? {
    face: THEATRE.wallFace, hi: THEATRE.wallFaceHi, base: THEATRE.baseboard,
    panel: 'rgba(0, 0, 0, 0.32)', panelHi: 'rgba(148, 158, 170, 0.16)',
    panelLo: 'rgba(0, 0, 0, 0.38)', rail: 'rgba(120, 132, 146, 0.35)',
    light: 'rgba(210, 224, 238, 0.07)',
  } : {
    face: COL.wallFace, hi: COL.wallFaceHi, base: COL.baseboard,
    panel: 'rgba(154, 124, 88, 0.24)', panelHi: 'rgba(255, 250, 238, 0.45)',
    panelLo: 'rgba(120, 94, 64, 0.30)', rail: null,
    light: 'rgba(255, 250, 238, 0.35)',
  };

  if (depth === 2) {
    // cornice: roof mass above, then crown moulding stepping out
    ctx.fillStyle = COL.wallTop;
    ctx.fillRect(px, py, TILE, 8);
    ctx.fillStyle = 'rgba(48, 34, 22, 0.28)';
    ctx.fillRect(px, py + 7, TILE, 1);

    ctx.fillStyle = T.hi;
    ctx.fillRect(px, py + 8, TILE, 3);
    ctx.fillStyle = T.face;
    ctx.fillRect(px, py + 11, TILE, 2);
    ctx.fillStyle = T.base;
    ctx.fillRect(px, py + 13, TILE, 1);
    ctx.fillStyle = T.face;
    ctx.fillRect(px, py + 14, TILE, 2);
    return;
  }

  if (depth === 1) {
    // the picture field: plaster, brighter at the top where light falls
    ctx.fillStyle = T.face;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = T.light;
    ctx.fillRect(px, py, TILE, 5);
    // picture rail
    ctx.fillStyle = T.base;
    ctx.fillRect(px, py + 2, TILE, 1);
    ctx.fillStyle = T.hi;
    ctx.fillRect(px, py + 3, TILE, 1);
    if (T.rail) {
      ctx.fillStyle = T.rail;
      ctx.fillRect(px, py + 4, TILE, 1);
    }
    return;
  }

  // depth 0 — dado rail, wainscot panelling, baseboard, contact shadow
  ctx.fillStyle = T.face;
  ctx.fillRect(px, py, TILE, TILE);

  ctx.fillStyle = T.base;
  ctx.fillRect(px, py + 4, TILE, 1);
  ctx.fillStyle = T.hi;
  ctx.fillRect(px, py + 5, TILE, 1);

  // panelled wainscot: one recessed panel per tile
  ctx.fillStyle = T.panel;
  ctx.fillRect(px + 2, py + 7, TILE - 4, 5);
  ctx.fillStyle = T.panelHi;
  ctx.fillRect(px + 2, py + 7, TILE - 4, 1);
  ctx.fillStyle = T.panelLo;
  ctx.fillRect(px + 2, py + 11, TILE - 4, 1);

  ctx.fillStyle = T.base;
  ctx.fillRect(px, py + 13, TILE, 3);
  ctx.fillStyle = 'rgba(20, 10, 12, 0.45)';
  ctx.fillRect(px, py + 15, TILE, 1);
}

/** The band of shadow a wall casts onto the floor tile below it. */
export function drawWallShadow(ctx, px, py) {
  ctx.fillStyle = 'rgba(58, 42, 30, 0.24)';
  ctx.fillRect(px, py, TILE, 2);
  ctx.fillStyle = 'rgba(58, 42, 30, 0.15)';
  ctx.fillRect(px, py + 2, TILE, 2);
  ctx.fillStyle = 'rgba(58, 42, 30, 0.07)';
  ctx.fillRect(px, py + 4, TILE, 2);
}

/**
 * An inlaid margin running around the edge of a room, mitred at the corners by
 * simply drawing each side independently. `sides` is which edges meet a wall.
 */
export function drawFloorBorder(ctx, px, py, sides, kind) {
  const band = kind === 'wood' ? '#8E5F38' : '#CBB894';
  const line = kind === 'wood' ? '#6B4830' : COL.brassDim;
  const W = 5;

  const strip = (x, y, w, h, lx, ly, lw, lh) => {
    ctx.fillStyle = band;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = line;
    ctx.fillRect(lx, ly, lw, lh);
  };

  if (sides.n) strip(px, py, TILE, W, px, py + W - 1, TILE, 1);
  if (sides.s) strip(px, py + TILE - W, TILE, W, px, py + TILE - W, TILE, 1);
  if (sides.w) strip(px, py, W, TILE, px + W - 1, py, 1, TILE);
  if (sides.e) strip(px + TILE - W, py, W, TILE, px + TILE - W, py, 1, TILE);
}

/** A brass threshold strip, laid across a doorway. */
export function drawThreshold(ctx, px, py, w, h) {
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px, py, w, 1);
  ctx.fillStyle = 'rgba(255, 244, 214, 0.35)';
  ctx.fillRect(px + 2, py + 1, w - 4, 1);
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

/**
 * A framed picture, hung from the picture rail. (px, py) is the top-centre of
 * the frame; the hanging wire runs up from there. Sizes vary so a wall of them
 * reads as a hang rather than a row of stamps.
 */
export function drawFrame(ctx, px, py, seed, size = null) {
  const h = hash(seed, 3);
  const SIZES = [[14, 11], [20, 15], [26, 18], [16, 20]];
  const [w, ht] = size !== null ? SIZES[size % SIZES.length]
    : SIZES[Math.floor(h * 977) % SIZES.length];
  const x = px - Math.floor(w / 2);

  // hanging wire back up to the rail
  ctx.fillStyle = 'rgba(90, 68, 46, 0.55)';
  ctx.fillRect(px - 2, py - 3, 1, 3);
  ctx.fillRect(px + 1, py - 3, 1, 3);

  // frame, with a lit top-left edge
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x, py, w, ht);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x, py, w, 1);
  ctx.fillRect(x, py, 1, ht);
  ctx.fillStyle = 'rgba(58, 42, 30, 0.40)';
  ctx.fillRect(x, py + ht - 1, w, 1);
  ctx.fillRect(x + w - 1, py, 1, ht);

  // the canvas: a horizon, a mass, a highlight — enough to read as a painting
  const inks = ['#7C6494', '#4F8296', '#9A6B4E', '#5D8A64', '#96525F', '#3F5A7A'];
  const base = inks[Math.floor(h * 613) % inks.length];
  const iw = w - 4;
  const ih = ht - 4;
  ctx.fillStyle = base;
  ctx.fillRect(x + 2, py + 2, iw, ih);
  ctx.fillStyle = 'rgba(255, 245, 220, 0.22)';
  ctx.fillRect(x + 2, py + 2, iw, Math.max(2, Math.floor(ih * 0.4)));
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.fillRect(x + 2, py + 2 + Math.floor(ih * 0.62), iw, ih - Math.floor(ih * 0.62) - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(x + 3 + (Math.floor(h * 311) % Math.max(1, iw - 5)), py + 4, 2, 2);

  // wall label underneath
  ctx.fillStyle = 'rgba(251, 243, 228, 0.55)';
  ctx.fillRect(px - 3, py + ht + 2, 6, 2);
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

/**
 * A gallery bench, cut from the same stone as the walls rather than wood, so it
 * reads as part of the architecture. (px, py) is the bottom-centre.
 */
export function drawBench(ctx, px, py) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 12, py - 2, 24, 3);

  // legs
  ctx.fillStyle = COL.baseboard;
  ctx.fillRect(px - 9, py - 6, 4, 6);
  ctx.fillRect(px + 5, py - 6, 4, 6);

  // slab, lit along the top edge
  ctx.fillStyle = COL.wallFace;
  ctx.fillRect(px - 12, py - 11, 24, 5);
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(px - 12, py - 11, 24, 2);
  ctx.fillStyle = COL.baseboard;
  ctx.fillRect(px - 12, py - 7, 24, 1);
  ctx.fillStyle = 'rgba(94, 74, 54, 0.35)';
  ctx.fillRect(px - 12, py - 11, 1, 5);
  ctx.fillRect(px + 11, py - 11, 1, 5);
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

/* ------------------------------------------------------------------ */
/* Architecture and furniture                                          */
/* ------------------------------------------------------------------ */

/**
 * A picture on a wall that runs away from the camera — the atrium's east and
 * west walls. Face-on frames can't be used there: those walls are seen from
 * above, not from the front. So the frame is turned on its side and given the
 * same cheated perspective as the cinema screen, standing a few pixels proud of
 * the wall with the light down the edge that looks into the room.
 *
 * (wallX, cy) is the point on the wall's inner face the picture centres on;
 * `side` is which wall it is, 'w' or 'e'.
 */
export function drawSideFrame(ctx, wallX, cy, side, seed) {
  const h = hash(seed, 5);
  const ht = 22 + Math.floor(h * 397) % 3 * 4;   // 22, 26 or 30 tall
  const d = 7;                                   // how far it stands proud
  const y = cy - Math.floor(ht / 2);
  const x = side === 'w' ? wallX : wallX - d;
  const lit = side === 'w' ? x + d - 1 : x;      // the edge facing the room

  // shadow cast along the wall
  ctx.fillStyle = 'rgba(59, 42, 34, 0.18)';
  ctx.fillRect(side === 'w' ? x + d : x - 2, y + 2, 2, ht);

  // frame
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x, y, d, ht);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x, y, d, 1);
  ctx.fillRect(x, y + ht - 1, d, 1);
  ctx.fillStyle = 'rgba(58, 42, 30, 0.35)';
  ctx.fillRect(side === 'w' ? x : x + d - 1, y, 1, ht);

  // the canvas, seen edge-on: a band of colour with the light along one side
  const inks = ['#7C6494', '#4F8296', '#9A6B4E', '#5D8A64', '#96525F', '#3F5A7A'];
  ctx.fillStyle = inks[Math.floor(h * 613) % inks.length];
  ctx.fillRect(x + 1, y + 2, d - 2, ht - 4);
  ctx.fillStyle = 'rgba(255, 245, 220, 0.20)';
  ctx.fillRect(x + 1, y + 2, d - 2, Math.floor((ht - 4) * 0.4));
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fillRect(x + 1, y + ht - 6, d - 2, 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(lit, y + 1, 1, ht - 2);

  // wall label, on the room side of the frame
  ctx.fillStyle = 'rgba(251, 243, 228, 0.55)';
  ctx.fillRect(side === 'w' ? x + d + 1 : x - 3, cy - 3, 2, 6);
}

/**
 * One machine in the machine hall: a cabinet with a panel of lights, a gauge
 * whose needle never quite settles, and a vent. Each one is an automation, and
 * the point of the room is that they are all visibly running while you stand
 * there doing nothing. (px, py) is the bottom-centre.
 */
export function drawMachine(ctx, px, py, w, seed, t, accent, running = true) {
  const h = hash(seed, 13);
  const ht = 30;
  const x = px - Math.floor(w / 2);
  const y = py - ht;

  ctx.fillStyle = COL.shadow;
  ctx.fillRect(x + 1, py - 3, w - 2, 3);

  // the cabinet, lit down its left edge like everything else in the building
  ctx.fillStyle = '#6E6A62';
  ctx.fillRect(x, y, w, ht);
  ctx.fillStyle = '#8A867C';
  ctx.fillRect(x, y, 2, ht);
  ctx.fillStyle = '#4E4A44';
  ctx.fillRect(x + w - 2, y, 2, ht);
  ctx.fillRect(x, py - 5, w, 5);           // plinth it stands on
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x, y, w, 1);

  // the panel: a dark face with lamps that blink on their own clock
  const pw = w - 6;
  ctx.fillStyle = '#22262A';
  ctx.fillRect(x + 3, y + 4, pw, 11);
  for (let i = 0; i < 3 && 3 + i * 4 < pw; i++) {
    const on = running && ((t / (240 + i * 130) + h * 9) % 2) < 1;
    ctx.fillStyle = on ? (i === 2 ? accent || '#7FE0D4' : '#7FE0D4') : '#2E3A3A';
    ctx.fillRect(x + 5 + i * 4, y + 6, 2, 2);
  }
  // a readout that scrolls, because a still panel reads as broken — which is
  // exactly what a machine with no automation behind it should look like
  if (running) {
    ctx.fillStyle = 'rgba(127, 224, 212, 0.45)';
    ctx.fillRect(x + 4, y + 10 + (Math.floor(t / 300 + h * 5) % 3), pw - 2, 1);
  }

  // gauge, needle twitching
  const gx = x + Math.floor(w / 2);
  const gy = y + 21;
  ctx.fillStyle = '#D9D2C2';
  ctx.fillRect(gx - 3, gy - 3, 7, 7);
  ctx.fillStyle = '#4E4A44';
  ctx.fillRect(gx - 3, gy - 3, 7, 1);
  ctx.fillRect(gx - 3, gy + 3, 7, 1);
  const swing = running ? Math.round(Math.sin(t / 700 + h * 6) * 2) : -2;
  ctx.fillStyle = COL.velvet;
  ctx.fillRect(gx + swing, gy - 2, 1, 3);

  // vents down one side, and the brass nameplate
  ctx.fillStyle = '#4E4A44';
  for (let j = 0; j < 3; j++) ctx.fillRect(x + 2, y + 18 + j * 3, 3, 1);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x + 3, py - 8, w - 6, 2);

  // Every third machine lets off steam. Two puffs on one cycle, rising and
  // fading, so the room has something moving above head height.
  if (running && seed % 3 === 0) {
    for (let i = 0; i < 2; i++) {
      const k = ((t / 1500 + i * 0.5 + h) % 1);
      const a = (1 - k) * 0.35;
      if (a <= 0.02) continue;
      const s = 2 + Math.round(k * 3);
      ctx.fillStyle = `rgba(233, 228, 214, ${a.toFixed(3)})`;
      ctx.fillRect(x + w - 5, y - Math.round(k * 14) - 2, s, s);
    }
  }
}

/**
 * The conveyor belt the machines feed. The slats and the crates on it are
 * placed from the clock rather than stepped, so the belt is still moving at
 * whatever frame rate the browser feels like giving us.
 */
export function drawBelt(ctx, x, y, w, ht, t) {
  // rails
  ctx.fillStyle = '#4E4A44';
  ctx.fillRect(x, y, w, ht);
  ctx.fillStyle = '#8A867C';
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = '#3A3730';
  ctx.fillRect(x, y + ht - 2, w, 2);

  // the band, with slats travelling along it
  ctx.fillStyle = '#2A2824';
  ctx.fillRect(x, y + 3, w, ht - 6);
  ctx.fillStyle = '#3E3B35';
  const roll = Math.floor(t / 40) % 8;
  for (let i = -8 + roll; i < w; i += 8) {
    if (i < 0 || i > w - 2) continue;
    ctx.fillRect(x + i, y + 3, 2, ht - 6);
  }

  // rollers at each end
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x, y + 3, 2, ht - 6);
  ctx.fillRect(x + w - 2, y + 3, 2, ht - 6);

  // crates riding it, evenly spaced and wrapping round
  const crate = ht - 9;
  for (let i = 0; i < 3; i++) {
    const cx = ((t / 24) + i * (w / 3)) % (w + 20) - 10;
    if (cx < -crate || cx > w) continue;
    const cw = Math.min(crate, w - Math.max(0, cx), cx + crate);
    const px = x + Math.max(0, cx);
    ctx.fillStyle = COL.wood;
    ctx.fillRect(px, y + 5, cw, crate);
    ctx.fillStyle = COL.woodDark;
    ctx.fillRect(px, y + 5 + crate - 1, cw, 1);
    ctx.fillStyle = 'rgba(255, 236, 200, 0.20)';
    ctx.fillRect(px, y + 5, cw, 1);
  }
}

/**
 * Pipework along a wall face, with brackets, a valve wheel and a gauge. This is
 * what the machine hall hangs instead of pictures.
 */
export function drawPipeRun(ctx, x, y, w, seed) {
  // the pipe itself, lit along the top
  ctx.fillStyle = '#7A6A52';
  ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = '#9C8A6C';
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = '#5A4C3A';
  ctx.fillRect(x, y + 4, w, 1);

  // brackets holding it to the wall, and joints between lengths
  for (let i = 8; i < w - 8; i += 22) {
    ctx.fillStyle = COL.brassDim;
    ctx.fillRect(x + i, y - 1, 3, 7);
  }
  // a valve wheel a third of the way along
  const vx = x + Math.floor(w * (0.3 + hash(seed, 17) * 0.4));
  ctx.fillStyle = COL.brass;
  ctx.fillRect(vx - 4, y - 4, 8, 3);
  ctx.fillRect(vx - 1, y - 4, 2, 6);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(vx - 4, y - 2, 8, 1);

  // a small dial at the far end
  ctx.fillStyle = '#D9D2C2';
  ctx.fillRect(x + w - 9, y + 6, 7, 7);
  ctx.fillStyle = '#4E4A44';
  ctx.fillRect(x + w - 9, y + 6, 7, 1);
  ctx.fillStyle = COL.velvet;
  ctx.fillRect(x + w - 6, y + 8, 1, 3);
}

/**
 * A pair of steel drums, of the sort that get wheeled in and out of a plant
 * room. They stand where two more machines used to: they fill the corner
 * without asking to be pressed. (px, py) is the bottom-centre.
 */
export function drawDrums(ctx, px, py, seed) {
  const h = hash(seed, 23);
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 13, py - 3, 26, 3);

  // two side by side, the far one set back and a shade darker
  const drums = [
    [px - 12, py - 4, 11, 16, '#6E6A62', '#8A867C'],
    [px + 1, py - 8, 11, 16, '#5E5A54', '#7A766E'],
  ];
  for (const [x, y, w, ht, body, lit] of drums) {
    ctx.fillStyle = body;
    ctx.fillRect(x, y - ht, w, ht);
    ctx.fillStyle = lit;
    ctx.fillRect(x, y - ht, 3, ht);
    ctx.fillStyle = '#43403A';
    ctx.fillRect(x + w - 2, y - ht, 2, ht);
    // rolling hoops
    ctx.fillStyle = '#43403A';
    ctx.fillRect(x, y - ht + 4, w, 1);
    ctx.fillRect(x, y - 5, w, 1);
    // the lid, seen from just above
    ctx.fillStyle = lit;
    ctx.fillRect(x + 1, y - ht, w - 2, 2);
    ctx.fillStyle = COL.brassDim;
    ctx.fillRect(x + 3, y - ht + 1, 3, 1);
    // a stencilled band, so they aren't two blank cylinders
    ctx.fillStyle = h > 0.5 ? 'rgba(220, 166, 70, 0.45)' : 'rgba(156, 64, 56, 0.45)';
    ctx.fillRect(x + 1, y - ht + 7, w - 2, 3);
  }
}

/**
 * A recessed downlight, for a room that would not have an open flame in it.
 * Baked with the walls rather than drawn live: an LED does not flicker, and the
 * whole point of it is that it is the calm opposite of a torch.
 */
export function drawDownlight(ctx, px, py) {
  // The cone first, so the housing sits on top of it. It has to be a long,
  // widening wash rather than a neat rectangle, or the fitting reads as a
  // blank plaque hung on the wall instead of as something switched on.
  for (let i = 8; i >= 1; i--) {
    ctx.fillStyle = `rgba(238, 240, 232, ${(0.020 * i).toFixed(3)})`;
    ctx.fillRect(px - 3 - i * 2, py + 5 + (8 - i) * 2, 6 + i * 4, 3);
  }

  // housing, recessed and dark so the lamp inside it looks bright
  ctx.fillStyle = '#1E2126';
  ctx.fillRect(px - 8, py - 1, 16, 7);
  ctx.fillStyle = '#575D66';
  ctx.fillRect(px - 8, py - 1, 16, 1);
  ctx.fillStyle = '#101317';
  ctx.fillRect(px - 8, py + 5, 16, 1);

  // the lamp, with a hot centre
  ctx.fillStyle = '#DCE4E8';
  ctx.fillRect(px - 6, py + 1, 12, 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(px - 4, py + 2, 8, 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(px - 6, py + 1, 12, 1);
}

/** A painted safety line on the floor: brass and dark, to stay in palette. */
export function drawHazardLine(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(58, 42, 30, 0.35)';
  ctx.fillRect(x, y, w, 4);
  for (let i = 0; i < w; i += 6) {
    ctx.fillStyle = 'rgba(220, 166, 70, 0.55)';
    ctx.fillRect(x + i, y, 3, 4);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fillRect(x, y, w, 1);
}

/**
 * The boardroom table, seen from above: a long slab of wood with chairs tucked
 * under both sides and the leavings of a meeting on it. (cx, cy) is its centre.
 *
 * Chairs are drawn as part of the table rather than as props of their own. They
 * are pushed in, so they never need depth-sorting against anything, and one
 * call keeps them evenly spaced along whichever pair of sides is the long one.
 */
export function drawBoardTable(ctx, cx, cy, w, h) {
  const x = cx - Math.floor(w / 2);
  const y = cy - Math.floor(h / 2);
  const acrossTheRoom = w >= h;

  // chairs, tucked under the long sides
  const run = acrossTheRoom ? w : h;
  const seats = Math.max(2, Math.floor(run / 20));
  const gap = run / seats;
  for (let i = 0; i < seats; i++) {
    const at = Math.round((acrossTheRoom ? x : y) + gap * (i + 0.5));
    for (const near of [-1, 1]) {
      // (sx, sy) is the chair's top-left, on whichever side of the table it is
      const sx = acrossTheRoom ? at - 7 : (near < 0 ? x - 7 : x + w - 1);
      const sy = acrossTheRoom ? (near < 0 ? y - 7 : y + h - 1) : at - 7;
      const cw = acrossTheRoom ? 14 : 8;
      const ch = acrossTheRoom ? 8 : 14;
      ctx.fillStyle = COL.woodDark;
      ctx.fillRect(sx, sy, cw, ch);
      ctx.fillStyle = COL.velvetDark;
      ctx.fillRect(sx + 1, sy + 1, cw - 2, ch - 2);
      // the lit edge goes on the side away from the table
      ctx.fillStyle = COL.velvet;
      if (acrossTheRoom) ctx.fillRect(sx + 1, near < 0 ? sy + 1 : sy + ch - 2, cw - 2, 1);
      else ctx.fillRect(near < 0 ? sx + 1 : sx + cw - 2, sy + 1, 1, ch - 2);
    }
  }

  // the slab
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(x + 2, y + h - 1, w, 3);
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 3);
  ctx.fillStyle = 'rgba(255, 236, 200, 0.14)';
  ctx.fillRect(x + 1, y + 1, w - 2, 1);

  // Everything on the top is placed along the table rather than across it:
  // `u` runs from one end to the other, `v` is the offset from its centre line.
  const at = (u, v) => (acrossTheRoom ? [x + u, cy + v] : [cx + v, y + u]);
  const box = (u, v, along, across) => (acrossTheRoom
    ? [x + u, cy + v, along, across] : [cx + v, y + u, across, along]);

  // grain, running the length of it
  ctx.fillStyle = 'rgba(107, 72, 48, 0.30)';
  const width = (acrossTheRoom ? h : w) - 8;
  for (let j = 0; j < width; j += 3) {
    ctx.fillRect(...box(3, j - Math.floor(width / 2), run - 6, 1));
  }

  // brass inlay down the centre line, and a lamp standing on it
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(...box(4, -1, run - 8, 1));
  ctx.fillStyle = COL.brass;
  ctx.fillRect(cx - 5, cy - 4, 10, 6);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(cx - 5, cy + 1, 10, 1);
  ctx.fillStyle = 'rgba(255, 240, 202, 0.35)';
  ctx.fillRect(cx - 3, cy - 3, 6, 2);

  // papers and a couple of mugs, so it looks like a meeting happened here
  const sheets = [[9, -7], [run - 18, 1]];
  for (const [u, v] of sheets) {
    ctx.fillStyle = COL.paper;
    ctx.fillRect(...box(u, v, 9, 7));
    ctx.fillStyle = 'rgba(122, 98, 70, 0.40)';
    for (let j = 1; j < 6; j += 2) ctx.fillRect(...box(u + 1, v + j, 7, 1));
  }
  for (const [u, v] of [[24, 3], [run - 29, -6]]) {
    const [mx, my] = at(u, v);
    ctx.fillStyle = COL.glass;
    ctx.fillRect(mx, my, 5, 5);
    ctx.fillStyle = '#6B4830';
    ctx.fillRect(mx + 1, my + 1, 3, 3);
  }
}

/**
 * A single sheet of paper on the wall, waiting to be read. Deliberately blank —
 * it's the résumé, and what's on it lives in the panel that opens, not in eight
 * pixels of pretend text.
 */
export function drawNotice(ctx, px, py) {
  const w = 13;
  const ht = 18;
  const x = px - Math.floor(w / 2);

  // it hangs a little off the wall, so it casts
  ctx.fillStyle = 'rgba(58, 42, 30, 0.22)';
  ctx.fillRect(x + 2, py + 2, w, ht);

  // the sheet
  ctx.fillStyle = COL.paper;
  ctx.fillRect(x, py, w, ht);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(x, py, w, 1);
  ctx.fillStyle = 'rgba(122, 98, 70, 0.45)';
  ctx.fillRect(x, py + ht - 1, w, 1);
  ctx.fillRect(x + w - 1, py, 1, ht);

  // the corner nearest the light curls forward
  ctx.fillStyle = 'rgba(122, 98, 70, 0.30)';
  ctx.fillRect(x + w - 4, py + ht - 3, 3, 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillRect(x + w - 4, py + ht - 4, 3, 1);

  // brass pin at the top, and the wall label under it
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px - 1, py - 2, 2, 3);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px - 1, py, 2, 1);
  ctx.fillStyle = 'rgba(251, 243, 228, 0.55)';
  ctx.fillRect(px - 3, py + ht + 2, 6, 2);
}

/**
 * A reading lectern with a book open on it. The pages breathe very slightly, so
 * that in a still room it is the thing that looks alive and asks to be read.
 * (px, py) is the bottom-centre.
 */
export function drawLectern(ctx, px, py, t = 0) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 10, py - 3, 20, 3);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.13)';
  ctx.fillRect(px - 12, py - 2, 24, 2);

  // splayed foot
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(px - 9, py - 6, 18, 4);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(px - 9, py - 6, 18, 1);

  // stem
  ctx.fillStyle = COL.wood;
  ctx.fillRect(px - 3, py - 16, 6, 11);
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(px + 1, py - 16, 2, 11);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px - 3, py - 12, 6, 1);

  // the sloped desk, seen from above and behind
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(px - 11, py - 24, 22, 9);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(px - 11, py - 24, 22, 1);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px - 11, py - 16, 22, 1);

  // the book, open at the middle. The two leaves lift a pixel out of phase.
  const lift = Math.round(Math.sin(t / 900));
  const rift = Math.round(Math.sin(t / 900 + 1.7));
  ctx.fillStyle = COL.paper;
  ctx.fillRect(px - 10, py - 27 + lift, 9, 10);
  ctx.fillRect(px + 1, py - 27 + rift, 9, 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillRect(px - 10, py - 27 + lift, 9, 1);
  ctx.fillRect(px + 1, py - 27 + rift, 9, 1);
  ctx.fillStyle = 'rgba(122, 98, 70, 0.35)';
  ctx.fillRect(px - 10, py - 18 + lift, 9, 1);
  ctx.fillRect(px + 1, py - 18 + rift, 9, 1);

  // the spine, and a suggestion of lines on each page
  ctx.fillStyle = COL.velvetDark;
  ctx.fillRect(px - 1, py - 27, 2, 10);
  ctx.fillStyle = 'rgba(122, 98, 70, 0.40)';
  for (let j = 0; j < 3; j++) {
    ctx.fillRect(px - 9, py - 24 + j * 3 + lift, 7, 1);
    ctx.fillRect(px + 2, py - 24 + j * 3 + rift, 7, 1);
  }

  // ribbon marker, hanging out of the bottom
  ctx.fillStyle = COL.velvet;
  ctx.fillRect(px - 1, py - 17, 2, 4);
}

/** A low glass vitrine. (px, py) is the bottom-centre. */
export function drawVitrine(ctx, px, py, accent) {
  const x = px - 16;

  ctx.fillStyle = COL.shadow;
  ctx.fillRect(x + 1, py - 3, 30, 3);

  // cabinet
  ctx.fillStyle = COL.wood;
  ctx.fillRect(x + 2, py - 11, 28, 9);
  ctx.fillStyle = COL.woodDark;
  ctx.fillRect(x + 2, py - 3, 28, 2);
  ctx.fillRect(x + 2, py - 11, 28, 1);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x + 6, py - 8, 20, 1);

  // glass hood
  ctx.fillStyle = 'rgba(191, 227, 232, 0.18)';
  ctx.fillRect(x + 3, py - 22, 26, 11);
  ctx.fillStyle = 'rgba(191, 227, 232, 0.5)';
  ctx.fillRect(x + 2, py - 23, 28, 1);
  ctx.fillRect(x + 2, py - 23, 1, 12);
  ctx.fillRect(x + 29, py - 23, 1, 12);

  // whatever is on show inside
  ctx.fillStyle = accent || COL.brass;
  ctx.fillRect(x + 11, py - 18, 4, 6);
  ctx.fillRect(x + 17, py - 16, 4, 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.fillRect(x + 6, py - 21, 1, 8);
  ctx.fillRect(x + 7, py - 21, 1, 4);
}

/** A stone bust on a pedestal. (px, py) is the bottom-centre. */
export function drawStatue(ctx, px, py) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 7, py - 2, 14, 3);

  // pedestal
  ctx.fillStyle = COL.stoneA;
  ctx.fillRect(px - 6, py - 15, 12, 14);
  ctx.fillStyle = COL.stoneB;
  ctx.fillRect(px + 1, py - 15, 5, 14);
  ctx.fillStyle = COL.stoneLine;
  ctx.fillRect(px - 6, py - 1, 12, 1);
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(px - 7, py - 17, 14, 2);

  // bust: shoulders, neck, head
  ctx.fillStyle = COL.wallFace;
  ctx.fillRect(px - 5, py - 22, 10, 5);
  ctx.fillRect(px - 2, py - 25, 4, 3);
  ctx.fillRect(px - 4, py - 32, 8, 7);
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(px - 4, py - 32, 3, 7);
  ctx.fillRect(px - 5, py - 22, 3, 5);
  ctx.fillStyle = 'rgba(138, 110, 76, 0.30)';
  ctx.fillRect(px + 2, py - 31, 2, 6);
  ctx.fillRect(px - 1, py - 29, 1, 1);
  ctx.fillRect(px + 1, py - 29, 1, 1);
}

/**
 * A patterned rug: fringe, a dark guard band, a woven border and a centre
 * medallion. Drawn into the floor, since you walk over it.
 *
 * The base tone wants to be a deep, desaturated one — a large flat saturated
 * rectangle on the floor stops reading as a textile and starts reading as a
 * hole in the ground.
 */
export function drawRug(ctx, px, py, w, h, base) {
  const x = px - Math.floor(w / 2);
  const y = py - Math.floor(h / 2);

  // fringe along the short ends
  ctx.fillStyle = 'rgba(226, 210, 180, 0.55)';
  for (let i = 2; i < w - 2; i += 3) {
    ctx.fillRect(x + i, y - 3, 1, 3);
    ctx.fillRect(x + i, y + h, 1, 3);
  }

  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);

  // guard bands
  ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x, y, 3, h);
  ctx.fillRect(x + w - 3, y, 3, h);

  // woven border: alternating ticks just inside the guard
  ctx.fillStyle = 'rgba(226, 200, 156, 0.34)';
  ctx.fillRect(x + 5, y + 5, w - 10, 1);
  ctx.fillRect(x + 5, y + h - 6, w - 10, 1);
  ctx.fillRect(x + 5, y + 5, 1, h - 10);
  ctx.fillRect(x + w - 6, y + 5, 1, h - 10);
  for (let i = x + 8; i < x + w - 8; i += 6) {
    ctx.fillRect(i, y + 7, 3, 1);
    ctx.fillRect(i, y + h - 8, 3, 1);
  }
  for (let j = y + 8; j < y + h - 8; j += 6) {
    ctx.fillRect(x + 7, j, 1, 3);
    ctx.fillRect(x + w - 8, j, 1, 3);
  }

  // field: a faint diagonal weave, so the middle isn't a flat slab
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let j = y + 10; j < y + h - 10; j += 4) {
    for (let i = x + 10; i < x + w - 10; i += 4) {
      if (((i + j) >> 2) % 2 === 0) ctx.fillRect(i, j, 2, 2);
    }
  }

  // centre medallion
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  const rx = Math.floor(w * 0.20);
  const ry = Math.floor(h * 0.26);
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (d > 1) continue;
      ctx.fillStyle = d > 0.78
        ? 'rgba(226, 200, 156, 0.32)'
        : d > 0.62 ? 'rgba(0, 0, 0, 0.22)' : 'rgba(226, 200, 156, 0.13)';
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }
}

/** Shadow along a wall that runs down the side of a room rather than across it. */
export function drawSideShadow(ctx, px, py, side) {
  const BANDS = [[0.20, 0], [0.11, 2], [0.05, 4]];
  for (const [alpha, off] of BANDS) {
    ctx.fillStyle = `rgba(58, 42, 30, ${alpha})`;
    ctx.fillRect(side === 'w' ? px + off : px + TILE - off - 2, py, 2, TILE);
  }
}

/**
 * A wall sconce with a live flame. The flame is three stacked bands that jitter
 * on their own cycles — offset by `seed` so no two torches in a room flicker in
 * step, which is what would give the whole wall a strobe.
 */
export function drawSconce(ctx, px, py, t = 0, seed = 0) {
  // bracket
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px - 1, py + 6, 2, 5);
  ctx.fillRect(px - 3, py + 10, 6, 1);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px - 3, py + 3, 6, 3);
  ctx.fillStyle = '#5A4436';
  ctx.fillRect(px - 2, py + 4, 4, 1);

  const p1 = Math.sin(t / 90 + seed * 2.1);
  const p2 = Math.sin(t / 57 + seed * 3.7);
  const sway = Math.round(p2 * 0.9);
  const tall = Math.round(p1 * 1.4);

  // halo on the plaster behind
  ctx.fillStyle = 'rgba(255, 198, 110, 0.13)';
  ctx.fillRect(px - 6, py - 5 - tall, 12, 14 + tall);
  ctx.fillStyle = 'rgba(255, 214, 140, 0.16)';
  ctx.fillRect(px - 4, py - 3 - tall, 8, 11 + tall);

  // outer flame
  ctx.fillStyle = '#E8763A';
  ctx.fillRect(px - 3, py - 1, 6, 5);
  ctx.fillRect(px - 2 + sway, py - 3 - tall, 4, 4);
  // middle
  ctx.fillStyle = '#F5A63C';
  ctx.fillRect(px - 2, py, 4, 4);
  ctx.fillRect(px - 1 + sway, py - 2 - tall, 2, 3);
  // hot core
  ctx.fillStyle = '#FFE9B0';
  ctx.fillRect(px - 1, py + 1, 2, 3);
  if (p1 > 0.2) ctx.fillRect(px + sway, py - 1 - tall, 1, 2);

  // the odd ember lifting off
  const eph = (t / 140 + seed) % 4;
  if (eph < 2.2) {
    ctx.fillStyle = 'rgba(255, 190, 110, 0.75)';
    ctx.fillRect(px + sway + (seed % 2 ? 1 : -1), Math.round(py - 4 - eph * 2.4), 1, 1);
  }
}

/** A fountain. (px, py) is the centre of the basin. */
export function drawFountain(ctx, px, py, r) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;
      let col;
      if (d > r - 3) col = COL.stoneB;
      else if (d > r - 5) col = COL.stoneA;
      else if (d > r - 6) col = '#6E7F80';
      else col = ((dx + dy + Math.round(d)) & 3) ? '#5A8C93' : '#6C9FA6';
      ctx.fillStyle = col;
      ctx.fillRect(px + dx, py + dy, 1, 1);
    }
  }

  // plinth and jet at the centre
  ctx.fillStyle = COL.stoneA;
  ctx.fillRect(px - 4, py - 8, 8, 10);
  ctx.fillStyle = COL.stoneB;
  ctx.fillRect(px + 1, py - 8, 3, 10);
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(px - 5, py - 10, 10, 2);

  ctx.fillStyle = 'rgba(190, 232, 240, 0.85)';
  ctx.fillRect(px - 1, py - 20, 2, 10);
  ctx.fillStyle = 'rgba(190, 232, 240, 0.5)';
  ctx.fillRect(px - 4, py - 17, 2, 6);
  ctx.fillRect(px + 3, py - 17, 2, 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(px - 1, py - 22, 2, 2);
}

/** A clipped hedge. (px, py) is the bottom-centre. */
export function drawHedge(ctx, px, py, w) {
  const x = px - Math.floor(w / 2);
  const h = 22;
  const top = py - h;

  ctx.fillStyle = 'rgba(34, 52, 26, 0.28)';
  ctx.fillRect(x + 3, py - 3, w, 4);

  // mass, with the corners knocked off so it isn't a slab
  ctx.fillStyle = COL.plantB;
  ctx.fillRect(x, top + 2, w, h - 2);
  ctx.fillRect(x + 2, top, w - 4, h);

  // sunlit crown
  ctx.fillStyle = COL.plantA;
  ctx.fillRect(x + 2, top, w - 4, 7);
  ctx.fillRect(x, top + 3, w, 4);

  // dappled foliage, deterministic so it never shimmers
  for (let j = 0; j < h; j += 2) {
    for (let i = 0; i < w; i += 2) {
      const n = hash(x + i, top + j);
      if (n > 0.74) {
        ctx.fillStyle = j < 8 ? '#84B76B' : COL.plantA;
        ctx.fillRect(x + i, top + j, 2, 2);
      } else if (n < 0.20) {
        ctx.fillStyle = '#3E6630';
        ctx.fillRect(x + i, top + j, 2, 2);
      }
    }
  }

  // shaded underside
  ctx.fillStyle = 'rgba(28, 44, 22, 0.42)';
  ctx.fillRect(x + 1, py - 5, w - 2, 5);
}

/** A lamp post. (px, py) is the bottom-centre. */
export function drawLamppost(ctx, px, py) {
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(px - 4, py - 2, 9, 2);
  ctx.fillStyle = COL.ink;
  ctx.fillRect(px - 3, py - 4, 6, 3);
  ctx.fillRect(px - 1, py - 34, 2, 31);
  ctx.fillStyle = '#5A4436';
  ctx.fillRect(px - 1, py - 34, 1, 31);

  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(px - 4, py - 44, 8, 10);
  ctx.fillStyle = '#FFE9B0';
  ctx.fillRect(px - 3, py - 43, 6, 8);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(px - 4, py - 46, 8, 2);
  ctx.fillRect(px - 2, py - 48, 4, 2);
  ctx.fillStyle = 'rgba(255, 226, 168, 0.20)';
  ctx.fillRect(px - 8, py - 46, 16, 14);
}

/** The big board out front. Lettering is drawn by the caller. */
export function drawBillboard(ctx, px, py, w) {
  const x = px - Math.floor(w / 2);
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(x + 2, py - 2, w, 3);
  ctx.fillStyle = COL.stoneB;
  ctx.fillRect(x + 4, py - 8, 8, 7);
  ctx.fillRect(x + w - 12, py - 8, 8, 7);

  ctx.fillStyle = COL.stoneA;
  ctx.fillRect(x, py - 28, w, 21);
  ctx.fillStyle = COL.wallFaceHi;
  ctx.fillRect(x, py - 30, w, 3);
  ctx.fillStyle = COL.stoneLine;
  ctx.fillRect(x, py - 8, w, 1);
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x + 3, py - 25, w - 6, 1);
  ctx.fillRect(x + 3, py - 11, w - 6, 1);
}

/**
 * A cloth banner hung across an archway, naming the wing beyond it. Drawn as a
 * depth-sorted prop so you walk underneath it. (px, py) is the centre of the
 * arch mouth; the banner hangs down from there. Lettering is the caller's job.
 */
export function drawBanner(ctx, px, py, w, accent) {
  const x = px - Math.floor(w / 2);

  // brass rail across the opening, with a finial at each end
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x - 3, py, w + 6, 3);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(x - 3, py, w + 6, 1);
  ctx.fillRect(x - 4, py - 1, 3, 5);
  ctx.fillRect(x + w + 1, py - 1, 3, 5);

  // cloth, darker down the right where it falls away from the light
  ctx.fillStyle = accent;
  ctx.fillRect(x, py + 3, w, 15);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(x + w - 6, py + 3, 6, 15);
  ctx.fillStyle = 'rgba(255, 246, 226, 0.10)';
  ctx.fillRect(x, py + 3, 5, 15);

  // woven edging
  ctx.fillStyle = COL.brassDim;
  ctx.fillRect(x, py + 4, w, 1);
  ctx.fillRect(x, py + 16, w, 1);

  // scalloped hem
  for (let i = 0; i < w; i += 6) {
    ctx.fillStyle = accent;
    ctx.fillRect(x + i + 1, py + 18, 4, 2);
    ctx.fillStyle = COL.brass;
    ctx.fillRect(x + i + 2, py + 20, 2, 1);
  }
}

/* ------------------------------------------------------------------ */
/* The screening room                                                  */
/* ------------------------------------------------------------------ */

/**
 * A cinema screen standing against the west wall, facing into the room. In a
 * top-down view a screen on a side wall would be edge-on and unreadable, so it
 * is drawn with a little cheated perspective — the same licence a top-down game
 * takes with every doorway.
 *
 * Everything is painted inside the footprint it is handed, curtains included,
 * so the caller can run it right up to the walls without it bleeding into them.
 * (px, py) is the bottom-centre.
 */
export function drawScreen(ctx, px, py, w, h, t, playing) {
  const x = px - Math.floor(w / 2);
  const y = py - h;

  // the light it throws across the carpet, breathing slightly
  const pulse = playing ? 0.55 + Math.sin(t / 260) * 0.18 : 0.28;
  for (let i = 5; i >= 1; i--) {
    ctx.fillStyle = `rgba(190, 214, 232, ${(0.030 * pulse * i).toFixed(3)})`;
    ctx.fillRect(x + w + 1, y + i * 4, i * 13, h - i * 8);
  }

  // black surround, filling the whole footprint
  ctx.fillStyle = '#0E1012';
  ctx.fillRect(x - 3, y, w + 6, h);
  ctx.fillStyle = THEATRE.trim;
  ctx.fillRect(x - 3, y, w + 6, 1);
  ctx.fillRect(x - 3, y + h - 1, w + 6, 1);

  // the surface, inset inside the surround
  const sy = y + 3;
  const sh = h - 6;
  ctx.fillStyle = playing ? THEATRE.screen : THEATRE.screenDim;
  ctx.fillRect(x, sy, w, sh);

  if (playing) {
    ctx.fillStyle = 'rgba(120, 150, 178, 0.20)';
    for (let j = (Math.floor(t / 55) % 6); j < sh; j += 6) {
      ctx.fillRect(x, sy + j, w, 1);
    }
  } else {
    // standby: a slow glint travelling down it, so it still reads as glass
    const g = (t / 34) % (sh + 40) - 20;
    ctx.fillStyle = 'rgba(200, 220, 236, 0.16)';
    ctx.fillRect(x, sy + Math.max(0, Math.min(sh - 6, g)), w, 6);
  }

  // sheen down the left edge, away from the room
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(x, sy, 2, sh);

  // Red house curtains, one tile deep, overlapping the screen at each end and
  // hanging a little proud of it into the room, so they read as cloth in front
  // of the screen rather than panels butted up against it.
  screenCurtain(ctx, x - 3, y, w + 11, TILE, 1);
  screenCurtain(ctx, x - 3, y + h - TILE, w + 11, TILE, -1);
}

/**
 * One drawn-back velvet curtain, facing into the room. The screen is rotated
 * onto the west wall here, so the pleats — which hang vertically in the real
 * world — run across the curtain in this view. `inner` is which side faces the
 * screen's opening, so the fabric can fall into shadow there. (x, y) is the
 * top-left, matching the screen's own footprint.
 */
function screenCurtain(ctx, x, y, w, h, inner) {
  ctx.fillStyle = THEATRE.curtain;
  ctx.fillRect(x, y, w, h);

  // pleats, running across the drop
  for (let j = 0; j < h; j += 4) {
    ctx.fillStyle = THEATRE.curtainDark;
    ctx.fillRect(x, y + j, w, 2);
    ctx.fillStyle = THEATRE.curtainHi;
    ctx.fillRect(x, y + j + 2, w, 1);
  }

  // facing right: lit down the edge that looks into the room, dark against
  // the wall behind it
  ctx.fillStyle = 'rgba(255, 198, 198, 0.16)';
  ctx.fillRect(x + w - 3, y, 3, h);
  ctx.fillStyle = 'rgba(18, 6, 9, 0.42)';
  ctx.fillRect(x, y, 3, h);

  // the fold nearest the opening falls into shadow
  ctx.fillStyle = 'rgba(18, 6, 9, 0.34)';
  ctx.fillRect(x, inner > 0 ? y + h - 3 : y, w, 3);

  // scalloped valance along the inner edge
  const vy = inner > 0 ? y + h - 2 : y;
  for (let i = 0; i < w; i += 6) {
    ctx.fillStyle = THEATRE.curtainDark;
    ctx.fillRect(x + i + 1, vy, 4, 2);
  }
}

/**
 * A plain black cinema seat. `facing` is 'left' or 'right'; the back goes on
 * the far side from whatever it faces. (px, py) is the bottom-centre.
 */
export function drawCinemaSeat(ctx, px, py, facing = 'left') {
  const flip = facing === 'left' ? 1 : -1;

  ctx.fillStyle = 'rgba(6, 8, 10, 0.45)';
  ctx.fillRect(px - 10, py - 2, 20, 3);

  // pedestal
  ctx.fillStyle = THEATRE.seatLo;
  ctx.fillRect(px - 5, py - 6, 10, 5);

  // seat pad
  ctx.fillStyle = THEATRE.seat;
  ctx.fillRect(px - 9, py - 16, 18, 11);
  ctx.fillStyle = THEATRE.seatHi;
  ctx.fillRect(px - 9, py - 16, 18, 1);
  ctx.fillStyle = THEATRE.seatLo;
  ctx.fillRect(px - 9, py - 6, 18, 1);

  // arm rests
  ctx.fillStyle = THEATRE.seatLo;
  ctx.fillRect(px - 10, py - 19, 20, 3);
  ctx.fillRect(px - 10, py - 8, 20, 2);

  // back
  const bx = px + flip * 7;
  ctx.fillStyle = THEATRE.seat;
  ctx.fillRect(bx - 4, py - 28, 8, 20);
  ctx.fillStyle = THEATRE.seatHi;
  ctx.fillRect(bx - 4, py - 28, 8, 1);
  ctx.fillStyle = THEATRE.seatLo;
  ctx.fillRect(bx + flip * 2, py - 28, 2, 20);

  // rim light down the side the screen is on, which is the only light in here
  ctx.fillStyle = 'rgba(196, 214, 232, 0.20)';
  ctx.fillRect(px - flip * 10, py - 19, 1, 13);
  ctx.fillRect(bx - flip * 4, py - 28, 1, 20);
}

/** A standing person. Blinks on their own clock so a room of them isn't synced. */
export function drawPerson(ctx, px, py, t, seed = 0, who = 'default') {
  const set = SPRITES.people[who] || Object.values(SPRITES.people)[0];
  const sprite = ((t + seed * 900) % 4200) < 130 ? set.blink : set.idle;
  const bob = Math.round(Math.sin((t + seed * 500) / 1300) * 0.5);

  ctx.fillStyle = 'rgba(20, 8, 10, 0.32)';
  ctx.fillRect(px - 6, py - 2, 12, 2);
  ctx.drawImage(sprite, px - 8, py - 17 + bob);
}

/** The contact shadow under the hovering droid. */
export function drawDroidShadow(ctx, cx, baseY, lift) {
  const w = Math.max(4, 9 - lift);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.26)';
  ctx.fillRect(cx - w, baseY, w * 2, 2);
  ctx.fillStyle = 'rgba(59, 42, 34, 0.15)';
  ctx.fillRect(cx - w + 2, baseY + 2, w * 2 - 4, 1);
}
