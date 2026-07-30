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
//     ┌───────────┐          ┌───────────┐
//     │AUTOMATIONS│          │ PERSONAL  │     north wings
//     └─────┰─────┘          └─────┰─────┘
//     ┌─────┸──────────────────────┸─────┐
//     │             ATRIUM               │     you start here
//     └─────┰──────────────────────┰─────┘
//     ┌─────┸─────┐          ┌─────┸─────┐
//     │  CLIENT   │          │ ABOUT ME  │     south wings
//     └───────────┘          └───────────┘
//
// There is no way in or out. The museum is the whole world, you begin in the
// middle of it, and every room is a few seconds away.

import { TILE, COL } from './config.js';
import {
  drawMarble, drawWood,
  drawWallTop, drawWallFace, drawWallShadow, drawSideShadow,
  drawFloorBorder, drawThreshold,
  drawPlinth, drawPlinthIcon, drawFrame, drawPlant, drawBench, drawRopeLine,
  drawLightPool, drawInlay, drawBanner,
  drawColumn, drawVitrine, drawStatue, drawRug, drawSconce,
} from './art.js';
import { drawTextCentered, textWidth } from './font.js';

export const MAP_W = 40;
export const MAP_H = 36;

// Rooms are an odd number of tiles wide and arches an odd number too, so both
// centre on a tile rather than a tile boundary. That is what lets every arch
// line up exactly with the plinth behind it: you come through the opening and
// the exhibit is straight ahead, with nothing to steer around.
//
// [x, y, w, h]
const REGIONS = [
  { rect: [9, 4, 9, 7], floor: 'wood', indoor: true, wing: 'automations' },
  { rect: [22, 4, 9, 7], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [9, 14, 22, 7], floor: 'marble', indoor: true },
  { rect: [9, 24, 9, 7], floor: 'wood', indoor: true, wing: 'client' },
  { rect: [22, 24, 9, 7], floor: 'wood', indoor: true, wing: 'about' },

  // Arches through the shared walls: five tiles wide, three deep because that
  // is how thick the walls are. These replaced the old connecting corridors.
  { rect: [11, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [24, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [11, 21, 5, 3], floor: 'marble', indoor: true },
  { rect: [24, 21, 5, 3], floor: 'marble', indoor: true },
];

// The building's footprint. Every tile inside it that isn't floor is solid
// masonry, which is what fills the courtyards between the wings — a radius
// around each room can't, because those courtyards open onto the map edge.
// It reaches y=0 so the north wings get a full three-tile-tall wall above them.
const MASONRY = [0, 0, 40, 36];

// Each wing gets its own accent, used on its rug, its vitrines and the icon
// floating in its case, so the four rooms don't read as one room repeated.
// Deep and desaturated on purpose: a large saturated rectangle on the floor
// reads as a hole rather than a carpet.
//
// `entry` is the side the arch is on. Furniture that would otherwise sit in
// the doorway goes to the opposite side of the plinth.
export const WING_ROOMS = {
  automations: { cx: 13, cy: 7, entry: 'south', label: 'Automations', accent: '#2E4A52' },
  personal: { cx: 26, cy: 7, entry: 'south', label: 'Personal Projects', accent: '#6B3F28' },
  client: { cx: 13, cy: 27, entry: 'north', label: 'Client Work', accent: '#2F3A55' },
  about: { cx: 26, cy: 27, entry: 'north', label: 'About Me', accent: '#4C2F49' },
};

// The row of each wall that carries pictures and sconces (the "picture field",
// two tiles above the floor it stands on).
const RAIL = { northWings: 2, atrium: 12, southWings: 22 };

// Wing names, on banners hung across each arch. The first attempt put them as
// inscriptions on the atrium floor, but the south pair sat on the very last row
// of marble and read as though they were outside the building. A banner is tied
// to its opening, unmistakably indoors, and you walk under it.
// [centre x px, y px of the arch mouth on the atrium side, text]
const BANNERS = [
  [216, 14 * TILE, 'AUTOMATIONS'],
  [424, 14 * TILE, 'PERSONAL'],
  [216, 21 * TILE, 'CLIENT WORK'],
  [424, 21 * TILE, 'ABOUT ME'],
];

// Wall sconces: [tile x, rail row]. Their pools are painted with the rest of
// the lighting, before the walls go down, so the glow can't spill onto plaster.
const SCONCES = [
  ...[11, 15, 24, 28].map((x) => [x, RAIL.northWings]),
  ...[10, 17, 22, 29].map((x) => [x, RAIL.atrium]),
  ...[11, 15, 24, 28].map((x) => [x, RAIL.southWings]),
];

// Arch mouths, for the brass thresholds laid across them.
const THRESHOLDS = [
  [11, 13, 5], [24, 13, 5],   // atrium -> north wings
  [11, 21, 5], [24, 21, 5],   // atrium -> south wings
];

// The building's centre line, and where you start.
const AXIS = 320;
export const START_TILE = { x: 20, y: 17 };

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
  for (const [id, w] of Object.entries(WING_ROOMS)) {
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
      else drawWood(c, px, py, x, y);
    }
  }

  // --- inlaid margin wherever a floor meets a wall ---
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const f = map.floor[idx(x, y)];
      if (!f || !map.indoor[idx(x, y)]) continue;
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
  drawLightPool(c, AXIS - 60, 14 * TILE + 8, 120, 104, 0.5);
  for (const w of Object.values(WING_ROOMS)) {
    drawLightPool(c, (w.cx - 3) * TILE, (w.cy - 3) * TILE, 7 * TILE, 7 * TILE);
  }
  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) !== 1) continue;
    drawLightPool(c, sx * TILE - 20, (ry + 2) * TILE, 56, 40, 0.8);
  }

  drawInlay(c, AXIS, 17 * TILE + 8, 26);
  for (const w of Object.values(WING_ROOMS)) {
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

/** Anything standing on the floor is depth-sorted, so the droid can pass behind it. */
function addProp(p) {
  map.props.push(p);
}

function decorate(c) {
  // ---- baked: wall-mounted, and flat on the ground ----

  // hangFrames and hangSconces both skip any tile that isn't a picture field,
  // so ranges can be given generously and the arches simply come out blank.
  hangFrames(c, 10, 16, RAIL.northWings);
  hangFrames(c, 23, 29, RAIL.northWings);
  hangFrames(c, 10, 16, RAIL.southWings);
  hangFrames(c, 23, 29, RAIL.southWings);
  hangFrames(c, 9, 30, RAIL.atrium);

  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) === 1) drawSconce(c, sx * TILE + 8, ry * TILE + 4);
  }

  // ---- depth-sorted props ----

  for (const p of map.plinths) {
    addProp({ kind: 'plinth', x: p.x, y: p.y, id: p.id });
  }

  // Banners hang at the atrium mouth of each arch, so the droid passes under
  // them on the way through.
  for (const [bx, by, text] of BANNERS) {
    const wing = Object.values(WING_ROOMS).find((w) => w.cx * TILE + 8 === bx
      && (w.entry === 'south' ? by < 16 * TILE : by > 16 * TILE));
    addProp({ kind: 'banner', x: bx, y: by, text, accent: wing ? wing.accent : COL.velvet });
  }

  for (const w of Object.values(WING_ROOMS)) {
    const back = w.entry === 'south' ? -1 : 1;   // away from the arch

    // flanking the plinth, clear of the arch's five-tile span
    addProp({ kind: 'statue', x: (w.cx - 3) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'statue', x: (w.cx + 3) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'rope', x: (w.cx - 2) * TILE, y: (w.cy + 1) * TILE + 10, span: 4 * TILE });

    // one bench, on the far side of the plinth from the doorway. Two benches
    // either side of the entry line is how the droid used to get wedged.
    addProp({ kind: 'bench', x: w.cx * TILE + 8, y: (w.cy + back * 2) * TILE + 12 });

    // vitrines and planting hug the side walls
    addProp({ kind: 'vitrine', x: (w.cx - 3) * TILE + 8, y: (w.cy + back * 2) * TILE + 12, accent: w.accent });
    addProp({ kind: 'vitrine', x: (w.cx + 3) * TILE + 8, y: (w.cy + back * 2) * TILE + 12, accent: w.accent });
    addProp({ kind: 'plant', x: (w.cx - 4) * TILE + 8, y: (w.cy - 2) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx + 4) * TILE + 8, y: (w.cy - 2) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx - 4) * TILE + 8, y: (w.cy + 2) * TILE + 14 });
    addProp({ kind: 'plant', x: (w.cx + 4) * TILE + 8, y: (w.cy + 2) * TILE + 14 });
  }

  // Atrium colonnade. Kept between the arches and the medallion: any closer in
  // and the columns straddle the medallion you start standing on.
  for (const cx of [17, 22]) {
    for (const cy of [15, 19]) {
      addProp({ kind: 'column', x: cx * TILE + 8, y: cy * TILE + 12 });
      map.colliders.push({ x: cx * TILE + 1, y: cy * TILE + 2, w: 14, h: 10 });
    }
  }

  // seating and planting down the short ends of the atrium
  for (const px of [9, 30]) {
    addProp({ kind: 'plant', x: px * TILE + 8, y: 15 * TILE + 14 });
    addProp({ kind: 'bench', x: px * TILE + 8, y: 17 * TILE + 12 });
    addProp({ kind: 'plant', x: px * TILE + 8, y: 19 * TILE + 14 });
  }

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
    case 'banner': {
      const w = Math.max(5 * TILE - 8, textWidth(p.text) + 14);
      drawBanner(c, x, y, w, p.accent);
      drawTextCentered(c, p.text, x, y + 8, { color: COL.paper, shadow: 'rgba(0,0,0,0.4)' });
      break;
    }
    default: break;
  }
}
