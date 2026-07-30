// The museum itself: room rectangles, the tile grid derived from them,
// collision, and the pre-rendered background canvas.
//
// The layout is defined as rectangles rather than a hand-typed tile map, so
// resizing a wing or moving a corridor is a one-line change.
//
//        ┌──────────┐              ┌──────────┐
//        │AUTOMATION│              │ PERSONAL │      north wings
//        └────┬─────┘              └─────┬────┘
//             │                          │
//        ┌────┴──────────────────────────┴────┐
//        │              ATRIUM               │
//        └────┬──────────┬────────┬──────────┘
//             │          │        │
//        ┌────┴─────┐  LOBBY   ┌──┴───────┐
//        │  CLIENT  │    │     │ ABOUT ME │    south wings
//        └──────────┘    │     └──────────┘
//                      doors

import { TILE, COL } from './config.js';
import {
  drawMarble, drawWood, drawStone, drawGrass,
  drawWallTop, drawWallFace,
  drawPlinth, drawPlinthIcon, drawFrame, drawPlant, drawBench, drawRopeLine,
  drawSign, drawFrontDoors, drawSteps, drawLightPool, drawInlay,
} from './art.js';
import { drawTextCentered, textWidth } from './font.js';

export const MAP_W = 48;
export const MAP_H = 47;

// [x, y, w, h]
const REGIONS = [
  { rect: [2, 3, 16, 11], floor: 'wood', indoor: true, wing: 'automations' },
  { rect: [30, 3, 16, 11], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [14, 17, 20, 10], floor: 'marble', indoor: true },
  { rect: [2, 31, 16, 11], floor: 'wood', indoor: true, wing: 'client' },
  { rect: [30, 31, 16, 11], floor: 'wood', indoor: true, wing: 'about' },

  // corridors linking each wing to the atrium
  { rect: [15, 14, 2, 3], floor: 'marble', indoor: true },
  { rect: [31, 14, 2, 3], floor: 'marble', indoor: true },
  { rect: [15, 27, 2, 4], floor: 'marble', indoor: true },
  { rect: [31, 27, 2, 4], floor: 'marble', indoor: true },

  // The entrance hall runs the full depth of the south wings so the doorway
  // sits in the facade itself, rather than at the end of a long shaft.
  { rect: [20, 27, 8, 14], floor: 'marble', indoor: true },
  { rect: [23, 41, 2, 2], floor: 'stone', indoor: true },

  // outdoors — kept clear of the south wings, which reach down to y41
  { rect: [6, 43, 36, 4], floor: 'grass', indoor: false },
  { rect: [14, 43, 20, 3], floor: 'stone', indoor: false },
];

// The building's footprint. Every tile inside it that isn't floor is solid
// masonry, which is what fills the courtyards between the wings — a radius
// around each room can't, because those courtyards open onto the map edge.
const MASONRY = [1, 1, 46, 42];

export const WINGS = {
  automations: { cx: 10, cy: 8, label: 'Automations' },
  personal: { cx: 38, cy: 8, label: 'Personal Projects' },
  client: { cx: 10, cy: 36, label: 'Client Work' },
  about: { cx: 38, cy: 36, label: 'About Me' },
};

// Floor-standing placards in the atrium, pointing the way to each wing.
const SIGNS = [
  { tx: 18, ty: 18, text: 'AUTOMATIONS', arrow: 'up' },
  { tx: 29, ty: 18, text: 'PERSONAL', arrow: 'up' },
  { tx: 18, ty: 25, text: 'CLIENT WORK', arrow: 'down' },
  { tx: 29, ty: 25, text: 'ABOUT ME', arrow: 'down' },
];

/* ------------------------------------------------------------------ */

export const map = {
  floor: new Array(MAP_W * MAP_H).fill(null),
  indoor: new Uint8Array(MAP_W * MAP_H),
  wing: new Array(MAP_W * MAP_H).fill(null),
  wall: new Uint8Array(MAP_W * MAP_H),
  canvas: null,
  plinths: [],
  props: [],
  colliders: [],
};

const idx = (x, y) => y * MAP_W + x;

export function tileFloor(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return null;
  return map.floor[idx(tx, ty)];
}

/** Solid = anything you can't stand on. */
export function isSolidTile(tx, ty) {
  return tileFloor(tx, ty) === null;
}

/** Pixel-space collision, including props. */
export function isBlocked(px, py) {
  if (isSolidTile(Math.floor(px / TILE), Math.floor(py / TILE))) return true;
  for (const c of map.colliders) {
    if (px >= c.x && px < c.x + c.w && py >= c.y && py < c.y + c.h) return true;
  }
  return false;
}

/** The wing whose plinth is close enough to interact with, or null. */
export function plinthNear(px, py) {
  for (const p of map.plinths) {
    const dx = px - p.x;
    const dy = py - p.y;
    if (dx * dx + dy * dy < 42 * 42) return p;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

export function buildMap() {
  // 1. paint the regions
  for (const r of REGIONS) {
    const [rx, ry, rw, rh] = r.rect;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        map.floor[idx(x, y)] = r.floor;
        map.indoor[idx(x, y)] = r.indoor ? 1 : 0;
        if (r.wing) map.wing[idx(x, y)] = r.wing;
      }
    }
  }

  // 2. every floorless tile inside the footprint is masonry; outside it, only
  //    a thin skirt where the building meets open ground. Everything else is
  //    true void and renders as night sky.
  const [mx, my, mw, mh] = MASONRY;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = idx(x, y);
      if (map.floor[i] !== null) continue;

      if (x >= mx && y >= my && x < mx + mw && y < my + mh) {
        map.wall[i] = 1;
        continue;
      }

      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1 && !near; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
          if (map.floor[idx(nx, ny)] !== null && map.indoor[idx(nx, ny)]) near = true;
        }
      }
      if (near) map.wall[i] = 1;
    }
  }

  // 3. one plinth per wing, dead centre
  for (const [id, w] of Object.entries(WINGS)) {
    const px = w.cx * TILE + 8;
    const py = w.cy * TILE + TILE;
    map.plinths.push({ id, x: px, y: py, label: w.label });
    map.colliders.push({ x: px - 11, y: py - 15, w: 22, h: 15 });
  }

  renderBackground();
}

/** Is this wall tile seen face-on? (i.e. is there floor directly below it) */
function isWallFace(x, y) {
  return map.wall[idx(x, y)] && tileFloor(x, y + 1) !== null && map.indoor[idx(x, y + 1)];
}

function renderBackground() {
  const cv = document.createElement('canvas');
  cv.width = MAP_W * TILE;
  cv.height = MAP_H * TILE;
  const c = cv.getContext('2d');

  // night sky behind everything, so voids read as "outside the frame"
  c.fillStyle = COL.sky;
  c.fillRect(0, 0, cv.width, cv.height);

  // floors
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const f = map.floor[idx(x, y)];
      if (!f) continue;
      const px = x * TILE;
      const py = y * TILE;
      if (f === 'marble') drawMarble(c, px, py, x, y);
      else if (f === 'wood') drawWood(c, px, py, x, y);
      else if (f === 'stone') drawStone(c, px, py, x, y);
      else if (f === 'grass') drawGrass(c, px, py, x, y);
    }
  }

  // the atrium's inlaid medallion, then the skylight pools over it and over
  // each wing's plinth
  drawInlay(c, 24 * TILE, 22 * TILE, 30);
  drawLightPool(c, 20 * TILE, 18 * TILE, 8 * TILE, 8 * TILE, 0.55);
  for (const w of Object.values(WINGS)) {
    drawLightPool(c, (w.cx - 2) * TILE, (w.cy - 2) * TILE, 5 * TILE, 5 * TILE);
  }

  // walls
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!map.wall[idx(x, y)]) continue;
      const px = x * TILE;
      const py = y * TILE;
      if (isWallFace(x, y)) drawWallFace(c, px, py);
      else drawWallTop(c, px, py, x, y);
    }
  }

  decorate(c);
  map.canvas = cv;
}

/* ------------------------------------------------------------------ */
/* Static dressing                                                     */
/* ------------------------------------------------------------------ */

function hangFrames(c, x0, x1, ty, step = 3) {
  for (let x = x0; x <= x1; x += step) {
    if (!isWallFace(x, ty)) continue;
    drawFrame(c, x * TILE + 1, ty * TILE + 4, x + ty);
  }
}

/**
 * Anything that stands on the floor goes into map.props instead of being baked
 * into the background, so the droid can pass behind it. Flat things — pictures
 * on walls, the steps, the doorway — stay baked; nothing can get behind them.
 */
function addProp(p) {
  map.props.push(p);
}

function decorate(c) {
  // ---- baked: wall-mounted and ground-flat only ----

  // paintings along the back wall of each wing
  hangFrames(c, 3, 16, 2);
  hangFrames(c, 31, 44, 2);
  hangFrames(c, 3, 16, 30);
  hangFrames(c, 31, 44, 30);
  // and across the atrium's north wall, skipping the corridor mouths
  hangFrames(c, 18, 29, 16, 4);

  // the open front doors, then the steps down to the plaza. Both are centred
  // on the doorway at x23-24, i.e. on pixel 384.
  drawFrontDoors(c, 384 - 32, 41 * TILE - 9);
  drawSteps(c, 384 - 32, 43 * TILE - 10, 4 * TILE);

  // ---- depth-sorted props ----

  for (const p of map.plinths) {
    addProp({ kind: 'plinth', x: p.x, y: p.y, id: p.id });
  }

  for (const w of Object.values(WINGS)) {
    addProp({ kind: 'bench', x: w.cx * TILE + 8, y: (w.cy + 3) * TILE + 12 });
    addProp({ kind: 'plant', x: (w.cx - 6) * TILE + 8, y: (w.cy - 3) * TILE });
    addProp({ kind: 'plant', x: (w.cx + 6) * TILE + 8, y: (w.cy - 3) * TILE });
    addProp({ kind: 'rope', x: (w.cx - 3) * TILE, y: (w.cy + 1) * TILE + 10, span: 6 * TILE });
  }

  // atrium plants flanking the corridor mouths
  addProp({ kind: 'plant', x: 14 * TILE + 8, y: 18 * TILE + 14 });
  addProp({ kind: 'plant', x: 33 * TILE + 8, y: 18 * TILE + 14 });
  addProp({ kind: 'plant', x: 14 * TILE + 8, y: 26 * TILE + 6 });
  addProp({ kind: 'plant', x: 33 * TILE + 8, y: 26 * TILE + 6 });

  // entrance hall: seating up by the atrium, planters flanking the doors
  addProp({ kind: 'bench', x: 21 * TILE, y: 30 * TILE + 12 });
  addProp({ kind: 'bench', x: 27 * TILE, y: 30 * TILE + 12 });
  addProp({ kind: 'plant', x: 20 * TILE + 8, y: 39 * TILE + 14 });
  addProp({ kind: 'plant', x: 27 * TILE + 8, y: 39 * TILE + 14 });

  // wayfinding placards
  for (const s of SIGNS) {
    addProp({
      kind: 'sign',
      x: s.tx * TILE + 8,
      y: s.ty * TILE + 14,
      text: s.text,
      arrow: s.arrow,
    });
  }

  // plants and placards are things you bump into
  for (const p of map.props) {
    if (p.kind === 'plant') map.colliders.push({ x: p.x - 6, y: p.y - 9, w: 12, h: 9 });
    if (p.kind === 'bench') map.colliders.push({ x: p.x - 11, y: p.y - 9, w: 22, h: 9 });
    if (p.kind === 'sign') map.colliders.push({ x: p.x - 8, y: p.y - 6, w: 16, h: 6 });
  }

  // draw order is fixed, so sort once rather than every frame
  map.props.sort((a, b) => a.y - b.y);
}

/** Draw one prop, offset by the camera. */
export function drawProp(c, p, ox, oy, t) {
  const x = Math.round(p.x - ox);
  const y = Math.round(p.y - oy);

  if (p.kind === 'plinth') {
    drawPlinth(c, x, y);
    drawPlinthIcon(c, x, y, p.id, t);
  } else if (p.kind === 'plant') {
    drawPlant(c, x, y);
  } else if (p.kind === 'bench') {
    drawBench(c, x, y);
  } else if (p.kind === 'rope') {
    drawRopeLine(c, x, y, p.span);
  } else if (p.kind === 'sign') {
    const w = textWidth(p.text) + 20;
    drawSign(c, x, y - 11, w, p.arrow);
    drawTextCentered(c, p.text, x + 5, y - 8, { color: COL.brass });
  }
}
