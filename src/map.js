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
//        │              ATRIUM                │
//        └────┬──────────┬────────┬───────────┘
//             │          │        │
//        ┌────┴─────┐  LOBBY   ┌──┴───────┐
//        │  CLIENT  │    │     │ ABOUT ME │    south wings
//        └──────────┘    │     └──────────┘
//                      doors
//                      plaza

import { TILE, COL } from './config.js';
import {
  drawMarble, drawWood, drawStone, drawGrass,
  drawWallTop, drawWallFace, drawWallShadow, drawSideShadow,
  drawFloorBorder, drawThreshold,
  drawPlinth, drawPlinthIcon, drawFrame, drawPlant, drawBench, drawRopeLine,
  drawSign, drawFrontDoors, drawSteps, drawLightPool, drawInlay,
  drawColumn, drawVitrine, drawStatue, drawRug, drawSconce,
  drawFountain, drawHedge, drawLamppost, drawBillboard,
} from './art.js';
import { drawTextCentered, textWidth } from './font.js';
import { SITE } from './data/projects.js';

export const MAP_W = 60;
export const MAP_H = 56;

// [x, y, w, h]
const REGIONS = [
  { rect: [3, 3, 20, 12], floor: 'wood', indoor: true, wing: 'automations' },
  { rect: [37, 3, 20, 12], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [16, 18, 28, 12], floor: 'marble', indoor: true },
  { rect: [3, 33, 20, 12], floor: 'wood', indoor: true, wing: 'client' },
  { rect: [37, 33, 20, 12], floor: 'wood', indoor: true, wing: 'about' },

  // corridors linking each wing to the atrium
  { rect: [18, 15, 2, 3], floor: 'marble', indoor: true },
  { rect: [40, 15, 2, 3], floor: 'marble', indoor: true },
  { rect: [18, 30, 2, 3], floor: 'marble', indoor: true },
  { rect: [40, 30, 2, 3], floor: 'marble', indoor: true },

  // The entrance hall runs the full depth of the south wings so the doorway
  // sits in the facade itself, rather than at the end of a long shaft.
  { rect: [26, 30, 8, 15], floor: 'marble', indoor: true },
  { rect: [29, 45, 2, 2], floor: 'stone', indoor: true },

  // outdoors — kept clear of the south wings, which reach down to y44
  { rect: [11, 47, 38, 9], floor: 'grass', indoor: false },
  { rect: [18, 47, 24, 7], floor: 'stone', indoor: false },
];

// The building's footprint. Every tile inside it that isn't floor is solid
// masonry, which is what fills the courtyards between the wings — a radius
// around each room can't, because those courtyards open onto the map edge.
// It reaches y=0 so the north wings get a full three-tile-tall wall above them.
const MASONRY = [0, 0, 60, 47];

// Each wing gets its own accent, used on its rug, its vitrines and the icon
// floating in its case, so the four rooms don't read as one room repeated.
// Deep and desaturated on purpose: a large saturated rectangle on the floor
// reads as a hole rather than a carpet.
export const WINGS = {
  automations: { cx: 12, cy: 8, label: 'Automations', accent: '#2E4A52' },
  personal: { cx: 46, cy: 8, label: 'Personal Projects', accent: '#6B3F28' },
  client: { cx: 12, cy: 38, label: 'Client Work', accent: '#2F3A55' },
  about: { cx: 46, cy: 38, label: 'About Me', accent: '#4C2F49' },
};

// The row of each wall that carries pictures and sconces (the "picture field",
// one tile above the floor it stands on).
const RAIL = { northWings: 1, atrium: 16, southWings: 31 };

// Floor-standing placards in the atrium, beside the corridor they point down.
const SIGNS = [
  { tx: 21, ty: 19, text: 'AUTOMATIONS', arrow: 'up' },
  { tx: 38, ty: 19, text: 'PERSONAL', arrow: 'up' },
  { tx: 21, ty: 28, text: 'CLIENT WORK', arrow: 'down' },
  { tx: 38, ty: 28, text: 'ABOUT ME', arrow: 'down' },
];

// Doorway mouths, for the brass thresholds laid across them.
const THRESHOLDS = [
  [18, 17, 2], [40, 17, 2],   // atrium -> north corridors
  [18, 29, 2], [40, 29, 2],   // atrium -> south corridors
  [26, 29, 8],                // atrium -> entrance hall
  [29, 46, 2],                // entrance hall -> outside
];

// Everything out front is laid out around the building's centre line, x=480.
const AXIS = 480;

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
    map.plinths.push({ id, x: px, y: py, label: w.label, accent: w.accent });
    map.colliders.push({ x: px - 11, y: py - 15, w: 22, h: 15 });
  }

  renderBackground();
}

/**
 * How far up a face-on wall this tile sits: 0 stands on the floor, 2 meets the
 * ceiling, -1 means the wall isn't seen face-on here (you're looking at its
 * top instead). Walls stop at three tiles, which is as tall as a room can be
 * before the geometry above it starts hiding the room behind.
 */
function wallFaceDepth(x, y) {
  if (!map.wall[idx(x, y)]) return -1;
  for (let d = 0; d < 3; d++) {
    const by = y + 1 + d;
    if (by >= MAP_H) return -1;
    const bi = idx(x, by);
    if (map.floor[bi] !== null) return map.indoor[bi] ? d : -1;
    if (!map.wall[bi]) return -1;
  }
  return -1;
}

function renderBackground() {
  const cv = document.createElement('canvas');
  cv.width = MAP_W * TILE;
  cv.height = MAP_H * TILE;
  const c = cv.getContext('2d');

  c.fillStyle = COL.sky;
  c.fillRect(0, 0, cv.width, cv.height);

  // --- floors ---
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

  // --- inlaid margin wherever a floor meets a wall ---
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const f = map.floor[idx(x, y)];
      if (!f || f === 'grass' || !map.indoor[idx(x, y)]) continue;
      const sides = {
        n: tileFloor(x, y - 1) === null,
        s: tileFloor(x, y + 1) === null,
        w: tileFloor(x - 1, y) === null,
        e: tileFloor(x + 1, y) === null,
      };
      if (sides.n || sides.s || sides.e || sides.w) {
        drawFloorBorder(c, x * TILE, y * TILE, sides, f);
      }
    }
  }

  // --- skylight, then the things laid into the floor ---
  // Light goes down first. Painting it over the rugs instead bleaches them
  // until they read as pools of water rather than textiles.
  drawLightPool(c, AXIS - 72, 19 * TILE, 144, 144, 0.5);
  for (const w of Object.values(WINGS)) {
    drawLightPool(c, (w.cx - 3) * TILE, (w.cy - 3) * TILE, 7 * TILE, 7 * TILE);
  }

  drawInlay(c, AXIS, 23 * TILE + 8, 34);
  for (const w of Object.values(WINGS)) {
    drawRug(c, w.cx * TILE + 8, (w.cy + 1) * TILE, 8 * TILE, 5 * TILE, w.accent);
  }

  // brass thresholds across the doorways
  for (const [tx, ty, tw] of THRESHOLDS) {
    drawThreshold(c, tx * TILE, ty * TILE + TILE - 3, tw * TILE, 3);
  }

  // --- walls ---
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!map.wall[idx(x, y)]) continue;
      const depth = wallFaceDepth(x, y);
      if (depth >= 0) drawWallFace(c, x * TILE, y * TILE, depth);
      else drawWallTop(c, x * TILE, y * TILE, x, y);
    }
  }

  // --- the shadow walls cast onto the floor at their feet ---
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map.floor[idx(x, y)] === null || !map.indoor[idx(x, y)]) continue;
      if (y > 0 && map.wall[idx(x, y - 1)]) drawWallShadow(c, x * TILE, y * TILE);
      if (map.wall[idx(x - 1, y)]) drawSideShadow(c, x * TILE, y * TILE, 'w');
      if (map.wall[idx(x + 1, y)]) drawSideShadow(c, x * TILE, y * TILE, 'e');
    }
  }

  decorate(c);
  map.canvas = cv;
}

/* ------------------------------------------------------------------ */
/* Dressing                                                            */
/* ------------------------------------------------------------------ */

/**
 * Hang pictures along a stretch of picture rail, at irregular spacing so the
 * wall reads as a curated hang rather than a row of stamps.
 */
function hangFrames(c, x0, x1, ty) {
  let x = x0;
  let n = 0;
  while (x <= x1) {
    if (wallFaceDepth(x, ty) === 1) {
      drawFrame(c, x * TILE + 8, ty * TILE + 6, x * 7 + ty);
      n += 1;
    }
    x += n % 3 === 2 ? 4 : 3;
  }
}

/** Sconces along a stretch of wall, each throwing a pool onto the floor below. */
function hangSconces(c, xs, ty) {
  for (const x of xs) {
    if (wallFaceDepth(x, ty) !== 1) continue;
    drawSconce(c, x * TILE + 8, ty * TILE + 4);
    drawLightPool(c, x * TILE - 20, (ty + 2) * TILE - 6, 56, 44, 0.75);
  }
}

/** Anything standing on the floor is depth-sorted, so the droid can pass behind it. */
function addProp(p) {
  map.props.push(p);
}

function decorate(c) {
  // ---- baked: wall-mounted, and flat on the ground ----

  hangFrames(c, 4, 21, RAIL.northWings);
  hangFrames(c, 38, 55, RAIL.northWings);
  hangFrames(c, 4, 21, RAIL.southWings);
  hangFrames(c, 38, 55, RAIL.southWings);
  hangFrames(c, 22, 37, RAIL.atrium);

  hangSconces(c, [6, 12, 18], RAIL.northWings);
  hangSconces(c, [40, 46, 52], RAIL.northWings);
  hangSconces(c, [6, 12, 18], RAIL.southWings);
  hangSconces(c, [40, 46, 52], RAIL.southWings);
  hangSconces(c, [24, 30, 36], RAIL.atrium);

  // the open front doors, then the steps down to the plaza
  drawFrontDoors(c, AXIS - 32, 45 * TILE - 9);
  drawSteps(c, AXIS - 32, 47 * TILE - 10, 4 * TILE);

  // ---- depth-sorted props ----

  for (const p of map.plinths) {
    addProp({ kind: 'plinth', x: p.x, y: p.y, id: p.id });
  }

  for (const w of Object.values(WINGS)) {
    // flanking the plinth
    addProp({ kind: 'statue', x: (w.cx - 6) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'statue', x: (w.cx + 6) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'rope', x: (w.cx - 4) * TILE, y: (w.cy + 1) * TILE + 12, span: 8 * TILE });
    // benches face the plinth, leaving the middle of the room clear to walk
    addProp({ kind: 'bench', x: (w.cx - 4) * TILE + 8, y: (w.cy + 4) * TILE + 8 });
    addProp({ kind: 'bench', x: (w.cx + 4) * TILE + 8, y: (w.cy + 4) * TILE + 8 });

    // vitrines down each side, and planting in the far corners
    for (const dy of [-1, 2]) {
      addProp({ kind: 'vitrine', x: (w.cx - 8) * TILE + 8, y: (w.cy + dy) * TILE + 8, accent: w.accent });
      addProp({ kind: 'vitrine', x: (w.cx + 8) * TILE + 8, y: (w.cy + dy) * TILE + 8, accent: w.accent });
    }
    addProp({ kind: 'plant', x: (w.cx - 9) * TILE + 8, y: (w.cy - 4) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx + 9) * TILE + 8, y: (w.cy - 4) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx - 9) * TILE + 8, y: (w.cy + 3) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx + 9) * TILE + 8, y: (w.cy + 3) * TILE + 14 });
  }

  // atrium colonnade, framing the medallion
  for (const cx of [25, 35]) {
    for (const cy of [20, 27]) {
      addProp({ kind: 'column', x: cx * TILE + 8, y: cy * TILE + 12 });
      map.colliders.push({ x: cx * TILE + 1, y: cy * TILE + 2, w: 14, h: 10 });
    }
  }

  // atrium planting, flanking the corridor mouths
  for (const px of [16, 43]) {
    addProp({ kind: 'plant', x: px * TILE + 8, y: 19 * TILE + 14 });
    addProp({ kind: 'plant', x: px * TILE + 8, y: 28 * TILE + 14 });
  }

  // seating and a pair of cases down the long sides of the atrium, so the
  // floor isn't one unbroken field of marble
  for (const px of [18, 41]) {
    addProp({ kind: 'bench', x: px * TILE + 8, y: 22 * TILE + 12 });
    addProp({ kind: 'bench', x: px * TILE + 8, y: 26 * TILE + 12 });
  }
  addProp({ kind: 'vitrine', x: 24 * TILE + 8, y: 19 * TILE + 12, accent: '#5A4A6B' });
  addProp({ kind: 'vitrine', x: 36 * TILE + 8, y: 19 * TILE + 12, accent: '#5A4A6B' });

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

  // entrance hall: a colonnade down both sides, seating, planters at the door
  for (const cy of [33, 39]) {
    for (const cx of [26, 33]) {
      addProp({ kind: 'column', x: cx * TILE + 8, y: cy * TILE + 12 });
      map.colliders.push({ x: cx * TILE + 1, y: cy * TILE + 2, w: 14, h: 10 });
    }
  }
  addProp({ kind: 'bench', x: 28 * TILE, y: 42 * TILE + 12 });
  addProp({ kind: 'bench', x: 32 * TILE, y: 42 * TILE + 12 });
  addProp({ kind: 'plant', x: 27 * TILE, y: 44 * TILE + 12 });
  addProp({ kind: 'plant', x: 33 * TILE, y: 44 * TILE + 12 });

  // ---- outside ----

  addProp({ kind: 'fountain', x: AXIS, y: 50 * TILE + 12, r: 26 });
  map.colliders.push({ x: AXIS - 28, y: 50 * TILE - 14, w: 56, h: 30 });

  addProp({ kind: 'billboard', x: 21 * TILE, y: 49 * TILE + 12, text: SITE.name });
  map.colliders.push({ x: 21 * TILE - 34, y: 49 * TILE + 4, w: 68, h: 8 });

  for (const lx of [20, 40]) {
    for (const ly of [47, 52]) {
      addProp({ kind: 'lamp', x: lx * TILE + 8, y: ly * TILE + 12 });
      map.colliders.push({ x: lx * TILE + 3, y: ly * TILE + 6, w: 10, h: 6 });
    }
  }

  for (const hy of [48, 52]) {
    for (const hx of [14, 45]) {
      addProp({ kind: 'hedge', x: hx * TILE, y: hy * TILE + 12, w: 5 * TILE });
      map.colliders.push({ x: hx * TILE - 40, y: hy * TILE, w: 80, h: 12 });
    }
  }

  // benches out front, facing the fountain
  addProp({ kind: 'bench', x: 24 * TILE, y: 52 * TILE + 4 });
  addProp({ kind: 'bench', x: 36 * TILE, y: 52 * TILE + 4 });

  // things you bump into
  for (const p of map.props) {
    if (p.kind === 'plant') map.colliders.push({ x: p.x - 6, y: p.y - 9, w: 12, h: 9 });
    if (p.kind === 'bench') map.colliders.push({ x: p.x - 11, y: p.y - 9, w: 22, h: 9 });
    if (p.kind === 'sign') map.colliders.push({ x: p.x - 8, y: p.y - 6, w: 16, h: 6 });
    if (p.kind === 'statue') map.colliders.push({ x: p.x - 7, y: p.y - 15, w: 14, h: 15 });
    if (p.kind === 'vitrine') map.colliders.push({ x: p.x - 16, y: p.y - 11, w: 32, h: 11 });
  }

  // draw order is fixed, so sort once rather than every frame
  map.props.sort((a, b) => a.y - b.y);
}

/** Draw one prop, offset by the camera. */
export function drawProp(c, p, ox, oy, t) {
  const x = Math.round(p.x - ox);
  const y = Math.round(p.y - oy);

  switch (p.kind) {
    case 'plinth':
      drawPlinth(c, x, y);
      drawPlinthIcon(c, x, y, p.id, t);
      break;
    case 'plant': drawPlant(c, x, y); break;
    case 'bench': drawBench(c, x, y); break;
    case 'rope': drawRopeLine(c, x, y, p.span); break;
    case 'column': drawColumn(c, x, y); break;
    case 'statue': drawStatue(c, x, y); break;
    case 'vitrine': drawVitrine(c, x, y, p.accent); break;
    case 'fountain': drawFountain(c, x, y, p.r); break;
    case 'hedge': drawHedge(c, x, y, p.w); break;
    case 'lamp': drawLamppost(c, x, y); break;
    case 'billboard': {
      const w = textWidth(p.text) * 2 + 24;
      drawBillboard(c, x, y, w);
      drawTextCentered(c, p.text, x, y - 21, { color: COL.ink, scale: 2 });
      break;
    }
    case 'sign': {
      const w = textWidth(p.text) + 20;
      drawSign(c, x, y - 11, w, p.arrow);
      drawTextCentered(c, p.text, x + 5, y - 8, { color: COL.brass });
      break;
    }
    default: break;
  }
}
