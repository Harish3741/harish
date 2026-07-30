// The museum itself: room rectangles, the tile grid derived from them,
// collision, and the pre-rendered background canvas.
//
// The layout is defined as rectangles rather than a hand-typed tile map, so
// resizing a wing or moving a corridor is a one-line change.
//
// Each wing shares a wall with the atrium and opens straight onto it through a
// wide arch. There are no connecting corridors: they were pure travel time, and
// crossing the museum took fifteen seconds.
//
//     ┌─────────────┐        ┌─────────────┐
//     │ AUTOMATIONS │        │  PERSONAL   │     north wings
//     └──────┰──────┘        └──────┰──────┘
//     ┌──────┸───────────────────────┸──────┐
//     │              ATRIUM                 │
//     └──┰──────────────┰───────────┰───────┘
//     ┌──┸──────┐    ┌──┸──┐     ┌──┸──────┐
//     │ CLIENT  │    │hall │     │ ABOUT   │    south wings
//     └─────────┘    │     │     └─────────┘
//                    └──┰──┘
//                     doors / plaza

import { TILE, COL } from './config.js';
import {
  drawMarble, drawWood, drawStone, drawGrass,
  drawWallTop, drawWallFace, drawWallShadow, drawSideShadow,
  drawFloorBorder, drawThreshold,
  drawPlinth, drawPlinthIcon, drawFrame, drawPlant, drawBench, drawRopeLine,
  drawFrontDoors, drawSteps, drawLightPool, drawInlay,
  drawColumn, drawVitrine, drawStatue, drawRug, drawSconce,
  drawFountain, drawHedge, drawLamppost, drawBillboard,
} from './art.js';
import { drawTextCentered, textWidth } from './font.js';
import { SITE } from './data/projects.js';

export const MAP_W = 40;
export const MAP_H = 48;

// [x, y, w, h]
const REGIONS = [
  { rect: [5, 4, 13, 9], floor: 'wood', indoor: true, wing: 'automations' },
  { rect: [22, 4, 13, 9], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [11, 16, 18, 9], floor: 'marble', indoor: true },
  { rect: [3, 28, 13, 9], floor: 'wood', indoor: true, wing: 'client' },
  { rect: [24, 28, 13, 9], floor: 'wood', indoor: true, wing: 'about' },

  // Arches through the shared walls, three tiles deep because that is how
  // thick the walls are. These replaced the old corridors.
  { rect: [12, 13, 4, 3], floor: 'marble', indoor: true },
  { rect: [24, 13, 4, 3], floor: 'marble', indoor: true },
  { rect: [11, 25, 4, 3], floor: 'marble', indoor: true },
  { rect: [25, 25, 4, 3], floor: 'marble', indoor: true },
  { rect: [19, 25, 2, 3], floor: 'marble', indoor: true },

  // entrance hall, reaching past the south wings to the facade
  { rect: [17, 28, 6, 10], floor: 'marble', indoor: true },
  { rect: [19, 38, 2, 3], floor: 'stone', indoor: true },

  // outdoors — clear of the south wings, which reach down to y36
  { rect: [8, 41, 24, 6], floor: 'grass', indoor: false },
  { rect: [13, 41, 14, 6], floor: 'stone', indoor: false },
];

// The building's footprint. Every tile inside it that isn't floor is solid
// masonry, which is what fills the courtyards between the wings — a radius
// around each room can't, because those courtyards open onto the map edge.
// It reaches y=0 so the north wings get a full three-tile-tall wall above them.
const MASONRY = [0, 0, 40, 41];

// Each wing gets its own accent, used on its rug, its vitrines and the icon
// floating in its case, so the four rooms don't read as one room repeated.
// Deep and desaturated on purpose: a large saturated rectangle on the floor
// reads as a hole rather than a carpet.
export const WINGS = {
  automations: { cx: 11, cy: 8, label: 'Automations', accent: '#2E4A52' },
  personal: { cx: 28, cy: 8, label: 'Personal Projects', accent: '#6B3F28' },
  client: { cx: 9, cy: 32, label: 'Client Work', accent: '#2F3A55' },
  about: { cx: 30, cy: 32, label: 'About Me', accent: '#4C2F49' },
};

// The row of each wall that carries pictures and sconces (the "picture field",
// two tiles above the floor it stands on).
const RAIL = { northWings: 2, atrium: 14, southWings: 26 };

// Wing names, inlaid into the atrium floor just inside each arch. Free-standing
// placards were the first attempt: in an atrium this compact they bunched up in
// the middle, read as one row of four, and stood in the way. An inscription
// sits under the arch it names, blocks nothing, and is more museum anyway.
// [centre x in px, baseline y in px, text, which way the chevron points]
const INSCRIPTIONS = [
  [224, 16 * TILE + 6, 'AUTOMATIONS', 'up'],
  [416, 16 * TILE + 6, 'PERSONAL', 'up'],
  [208, 24 * TILE + 3, 'CLIENT WORK', 'down'],
  [432, 24 * TILE + 3, 'ABOUT ME', 'down'],
];

// Wall sconces: [tile x, rail row]. Their pools are painted with the rest of
// the lighting, before the walls go down, so the glow can't spill onto plaster.
const SCONCES = [
  ...[7, 11, 15, 24, 28, 32].map((x) => [x, 2]),
  ...[11, 17, 22, 28].map((x) => [x, 14]),
  ...[5, 9, 13, 18, 22, 27, 31, 35].map((x) => [x, 26]),
];

// Arch mouths, for the brass thresholds laid across them.
const THRESHOLDS = [
  [12, 15, 4], [24, 15, 4],   // atrium -> north wings
  [11, 27, 4], [25, 27, 4],   // atrium -> south wings
  [19, 27, 2],                // atrium -> entrance hall
  [19, 40, 2],                // entrance hall -> outside
];

// Everything on the entrance axis is laid out around x=320.
const AXIS = 320;

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
  drawLightPool(c, AXIS - 64, 17 * TILE, 128, 128, 0.5);
  for (const w of Object.values(WINGS)) {
    drawLightPool(c, (w.cx - 3) * TILE, (w.cy - 3) * TILE, 7 * TILE, 7 * TILE);
  }
  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) !== 1) continue;
    drawLightPool(c, sx * TILE - 20, (ry + 2) * TILE, 56, 40, 0.8);
  }

  drawInlay(c, AXIS, 20 * TILE + 8, 28);
  for (const w of Object.values(WINGS)) {
    drawRug(c, w.cx * TILE + 8, (w.cy + 1) * TILE, 7 * TILE, 4 * TILE, w.accent);
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

/** An engraved wing name, inlaid into the floor beneath its arch. */
function inscribe(c, cx, cy, text, arrow) {
  drawTextCentered(c, text, cx, cy + 1, { color: 'rgba(255, 250, 236, 0.55)' });
  drawTextCentered(c, text, cx, cy, { color: COL.brassDim });

  // a chevron on each side, pointing the way through
  const half = textWidth(text) / 2 + 8;
  const dir = arrow === 'up' ? -1 : 1;
  c.fillStyle = COL.brassDim;
  for (const side of [-1, 1]) {
    const ax = Math.round(cx + side * half);
    for (let i = 0; i < 3; i++) {
      c.fillRect(ax - i, cy + 2 + dir * (2 - i) + (dir < 0 ? 2 : 0), 1, 1);
      c.fillRect(ax + i, cy + 2 + dir * (2 - i) + (dir < 0 ? 2 : 0), 1, 1);
    }
  }
}

/** Anything standing on the floor is depth-sorted, so the droid can pass behind it. */
function addProp(p) {
  map.props.push(p);
}

function decorate(c) {
  // ---- baked: wall-mounted, and flat on the ground ----

  // hangFrames and hangSconces both skip any tile that isn't a picture field,
  // so ranges can be given generously and the arches simply come out blank.
  hangFrames(c, 6, 16, RAIL.northWings);
  hangFrames(c, 23, 33, RAIL.northWings);
  hangFrames(c, 4, 14, RAIL.southWings);
  hangFrames(c, 25, 35, RAIL.southWings);
  hangFrames(c, 11, 28, RAIL.atrium);

  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) === 1) drawSconce(c, sx * TILE + 8, ry * TILE + 4);
  }

  for (const [ix, iy, text, arrow] of INSCRIPTIONS) inscribe(c, ix, iy, text, arrow);

  // the open front doors, then the steps down to the plaza
  drawFrontDoors(c, AXIS - 32, 38 * TILE - 9);
  drawSteps(c, AXIS - 32, 41 * TILE - 10, 4 * TILE);

  // ---- depth-sorted props ----

  for (const p of map.plinths) {
    addProp({ kind: 'plinth', x: p.x, y: p.y, id: p.id });
  }

  for (const w of Object.values(WINGS)) {
    // flanking the plinth
    addProp({ kind: 'statue', x: (w.cx - 4) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'statue', x: (w.cx + 4) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'rope', x: (w.cx - 3) * TILE, y: (w.cy + 1) * TILE + 12, span: 6 * TILE });
    // benches face the plinth, leaving the middle of the room clear to walk
    addProp({ kind: 'bench', x: (w.cx - 3) * TILE + 8, y: (w.cy + 3) * TILE + 10 });
    addProp({ kind: 'bench', x: (w.cx + 3) * TILE + 8, y: (w.cy + 3) * TILE + 10 });

    // vitrines down each side, and planting in the corners
    addProp({ kind: 'vitrine', x: (w.cx - 5) * TILE + 8, y: (w.cy - 1) * TILE + 8, accent: w.accent });
    addProp({ kind: 'vitrine', x: (w.cx + 5) * TILE + 8, y: (w.cy - 1) * TILE + 8, accent: w.accent });
    addProp({ kind: 'plant', x: (w.cx - 6) * TILE + 8, y: (w.cy - 3) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx + 6) * TILE + 8, y: (w.cy - 3) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx - 6) * TILE + 8, y: (w.cy + 3) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx + 6) * TILE + 8, y: (w.cy + 3) * TILE + 14 });
  }

  // atrium colonnade, set wide of the arches so it never gets in the way
  for (const cx of [16, 23]) {
    addProp({ kind: 'column', x: cx * TILE + 8, y: 20 * TILE + 12 });
    map.colliders.push({ x: cx * TILE + 1, y: 20 * TILE + 2, w: 14, h: 10 });
  }

  // Seating and planting down the short ends of the atrium, kept off rows 16
  // and 24 so nothing sits on top of the floor inscriptions.
  for (const px of [11, 28]) {
    addProp({ kind: 'plant', x: px * TILE + 8, y: 18 * TILE + 14 });
    addProp({ kind: 'bench', x: px * TILE + 8, y: 21 * TILE + 12 });
    addProp({ kind: 'plant', x: px * TILE + 8, y: 23 * TILE + 14 });
  }

  // entrance hall: a colonnade down both sides, planters at the door
  for (const cy of [31, 35]) {
    for (const cx of [17, 22]) {
      addProp({ kind: 'column', x: cx * TILE + 8, y: cy * TILE + 12 });
      map.colliders.push({ x: cx * TILE + 1, y: cy * TILE + 2, w: 14, h: 10 });
    }
  }
  addProp({ kind: 'plant', x: 17 * TILE + 8, y: 37 * TILE + 14 });
  addProp({ kind: 'plant', x: 22 * TILE + 8, y: 37 * TILE + 14 });

  // ---- outside ----

  addProp({ kind: 'fountain', x: AXIS, y: 44 * TILE + 8, r: 22 });
  map.colliders.push({ x: AXIS - 24, y: 44 * TILE - 14, w: 48, h: 26 });

  addProp({ kind: 'billboard', x: 23 * TILE, y: 45 * TILE + 12, text: SITE.name });
  map.colliders.push({ x: 23 * TILE - 50, y: 45 * TILE + 4, w: 100, h: 8 });

  for (const lx of [14, 25]) {
    for (const ly of [41, 45]) {
      addProp({ kind: 'lamp', x: lx * TILE + 8, y: ly * TILE + 12 });
      map.colliders.push({ x: lx * TILE + 3, y: ly * TILE + 6, w: 10, h: 6 });
    }
  }

  for (const hy of [42, 46]) {
    for (const hx of [10, 29]) {
      addProp({ kind: 'hedge', x: hx * TILE, y: hy * TILE + 12, w: 5 * TILE });
      map.colliders.push({ x: hx * TILE - 40, y: hy * TILE, w: 80, h: 12 });
    }
  }

  // a bench out front, facing the fountain
  addProp({ kind: 'bench', x: 17 * TILE, y: 46 * TILE + 4 });

  // things you bump into
  for (const p of map.props) {
    if (p.kind === 'plant') map.colliders.push({ x: p.x - 6, y: p.y - 9, w: 12, h: 9 });
    if (p.kind === 'bench') map.colliders.push({ x: p.x - 11, y: p.y - 9, w: 22, h: 9 });
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
    default: break;
  }
}
