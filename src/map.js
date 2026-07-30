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
import { PAINTINGS } from './data/projects.js';

export const MAP_W = 40;
export const MAP_H = 32;

// Rooms are an odd number of tiles wide and arches an odd number too, so both
// centre on a tile rather than a tile boundary. That is what lets every arch
// line up exactly with the plinth behind it: you come through the opening and
// the exhibit is straight ahead, with nothing to steer around.
//
// [x, y, w, h]
const REGIONS = [
  { rect: [10, 4, 9, 7], floor: 'wood', indoor: true, wing: 'automations' },
  { rect: [21, 4, 9, 7], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [11, 14, 18, 3], floor: 'marble', indoor: true },
  { rect: [10, 20, 9, 7], floor: 'wood', indoor: true, wing: 'client' },
  { rect: [21, 20, 9, 7], floor: 'wood', indoor: true, wing: 'about' },

  // Arches through the shared walls: five tiles wide, three deep because that
  // is how thick the walls are. These replaced the old connecting corridors.
  { rect: [12, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [23, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [12, 17, 5, 3], floor: 'marble', indoor: true },
  { rect: [23, 17, 5, 3], floor: 'marble', indoor: true },
];

// The building's footprint. Every tile inside it that isn't floor is solid
// masonry, which is what fills the courtyards between the wings — a radius
// around each room can't, because those courtyards open onto the map edge.
// It reaches y=0 so the north wings get a full three-tile-tall wall above them.
const MASONRY = [0, 0, 40, 32];

// Each wing gets its own accent, used on its rug, its vitrines and the icon
// floating in its case, so the four rooms don't read as one room repeated.
// Deep and desaturated on purpose: a large saturated rectangle on the floor
// reads as a hole rather than a carpet.
//
// `entry` is the side the arch is on. Furniture that would otherwise sit in
// the doorway goes to the opposite side of the plinth.
export const WING_ROOMS = {
  automations: { cx: 14, cy: 7, entry: 'south', rail: 2, label: 'Automations', accent: '#2E4A52' },
  personal: { cx: 25, cy: 7, entry: 'south', rail: 2, label: 'Personal Projects', accent: '#6B3F28' },
  client: { cx: 14, cy: 23, entry: 'north', rail: 18, label: 'Client Work', accent: '#2F3A55' },
  about: { cx: 25, cy: 23, entry: 'north', rail: 18, label: 'About Me', accent: '#4C2F49' },
};

// The row of each wall that carries pictures and sconces (the "picture field",
// two tiles above the floor it stands on).
const RAIL = { northWings: 2, atrium: 12, southWings: 18 };

// Wing names, on banners hung across each arch. The first attempt put them as
// inscriptions on the atrium floor, but the south pair sat on the very last row
// of marble and read as though they were outside the building. A banner is tied
// to its opening, unmistakably indoors, and you walk under it.
// [centre x px, y px of the arch mouth on the atrium side, text]
const BANNERS = [
  [232, 14 * TILE, 'AUTOMATIONS'],
  [408, 14 * TILE, 'PERSONAL'],
  [232, 17 * TILE, 'CLIENT WORK'],
  [408, 17 * TILE, 'ABOUT ME'],
];

// Wall sconces: [tile x, rail row]. Their pools are painted with the rest of
// the lighting, before the walls go down, so the glow can't spill onto plaster.
const SCONCES = [
  ...[12, 16, 23, 27].map((x) => [x, RAIL.northWings]),
  ...[11, 18, 21, 28].map((x) => [x, RAIL.atrium]),
  ...[11, 17, 22, 28].map((x) => [x, RAIL.southWings]),
];

// Arch mouths, for the brass thresholds laid across them.
const THRESHOLDS = [
  [12, 13, 5], [23, 13, 5],   // atrium -> north wings
  [12, 17, 5], [23, 17, 5],   // atrium -> south wings
];

// The building's centre line, and where you start.
const AXIS = 320;
export const START_PX = { x: AXIS, y: 15 * TILE + 12 };

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
  artworks: [],   // framed pictures you can walk up to and read
  seats: [],      // benches you can sit on
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

function nearest(list, px, py, r) {
  let best = null;
  let bestD = r * r;
  for (const item of list) {
    const dx = px - item.x;
    const dy = py - item.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = item; }
  }
  return best;
}

/** The wing whose plinth is close enough to interact with, or null. */
export function plinthNear(px, py) {
  return nearest(map.plinths, px, py, 42);
}

/** The picture you are standing in front of, or null. */
export function artworkNear(px, py) {
  return nearest(map.artworks, px, py, 26);
}

/** The bench you could sit on, or null. */
export function seatNear(px, py) {
  return nearest(map.seats, px, py, 26);
}

/**
 * Whatever pressing E would act on right here. Ordered by how deliberate the
 * approach has to be: a plinth is the point of the room, a picture needs you
 * standing at the wall, a bench is what is left.
 */
export function interactableNear(px, py) {
  return plinthNear(px, py) || artworkNear(px, py) || seatNear(px, py);
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
  drawLightPool(c, AXIS - 60, 14 * TILE, 120, 48, 0.55);
  for (const w of Object.values(WING_ROOMS)) {
    drawLightPool(c, (w.cx - 3) * TILE, (w.cy - 3) * TILE, 7 * TILE, 7 * TILE);
  }
  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) !== 1) continue;
    drawLightPool(c, sx * TILE - 20, (ry + 2) * TILE, 56, 40, 0.8);
  }

  drawInlay(c, AXIS, 15 * TILE + 8, 21);
  for (const w of Object.values(WING_ROOMS)) {
    drawRug(c, w.cx * TILE + 8, (w.cy + 1) * TILE - 4, 5 * TILE, 3 * TILE, w.accent);
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
 * Hang pictures symmetrically about a centre line. `offsets` are tile deltas
 * from that centre and must themselves be symmetric; sizes are mirrored, so the
 * pair at -3 and +3 match. Anything landing on an arch is skipped.
 *
 * Each frame also becomes an entry in map.artworks, so it can be read from the
 * floor in front of it. Captions come from data/projects.js by index; a frame
 * with no caption is simply decorative.
 */
function hangSymmetric(c, cx, ty, offsets, wingId) {
  const captions = (PAINTINGS && PAINTINGS[wingId]) || [];
  let slot = 0;
  for (const d of offsets) {
    const x = cx + d;
    if (wallFaceDepth(x, ty) !== 1) { slot += 1; continue; }
    // mirrored size: the pair either side of centre are the same
    const size = [0, 1, 2, 1][Math.min(3, Math.abs(d))];
    drawFrame(c, x * TILE + 8, ty * TILE + 6, x * 7 + ty, size);

    const info = captions[slot];
    if (info) {
      map.artworks.push({
        x: x * TILE + 8,
        y: (ty + 2) * TILE + 14,     // the floor tile in front of the frame
        title: info.title,
        caption: info.caption,
        image: info.image || null,
        label: 'Painting',
      });
    }
    slot += 1;
  }
}

/** Anything standing on the floor is depth-sorted, so the droid can pass behind it. */
function addProp(p) {
  map.props.push(p);
}

function decorate(c) {
  // ---- baked: wall-mounted, and flat on the ground ----

  // North wings have a clear back wall, so four pictures sit evenly across it.
  // South wings are entered through that same wall, so their pictures go either
  // side of the arch. Both sets are symmetric about the room's centre line.
  for (const [id, w] of Object.entries(WING_ROOMS)) {
    const offsets = w.entry === 'south' ? [-3, -1, 1, 3] : [-4, -3, 3, 4];
    hangSymmetric(c, w.cx, w.rail, offsets, id);
  }
  // and across the atrium's own wall, symmetric about the building's axis
  hangSymmetric(c, 20, RAIL.atrium, [-3, -2, 1, 2], 'atrium');

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
    const front = w.entry === 'south' ? 1 : -1;   // toward the arch

    // flanking the plinth, clear of the arch's five-tile span
    addProp({ kind: 'statue', x: (w.cx - 3) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'statue', x: (w.cx + 3) * TILE + 8, y: w.cy * TILE + 10 });
    addProp({ kind: 'rope', x: (w.cx - 2) * TILE, y: (w.cy + front) * TILE + 10, span: 4 * TILE });

    // A pair of benches on the way in, set two tiles off the centre line. They
    // have to sit outside the plinth's interact radius or pressing E on the
    // bench opens the exhibit list instead of sitting you down.
    for (const side of [-1, 1]) {
      addProp({
        kind: 'bench',
        x: (w.cx + side * 3) * TILE + 8,
        y: (w.cy + front * 2) * TILE + 12,
      });
    }

    // planting in the four corners
    for (const sx of [-4, 4]) {
      for (const sy of [-2, 2]) {
        addProp({ kind: 'plant', x: (w.cx + sx) * TILE + 8, y: (w.cy + sy) * TILE + 14 });
      }
    }
  }

  // A pair of columns at each end of the atrium. The atrium is three tiles
  // deep now, so anything in the middle of it is in the way.
  for (const cx of [11, 28]) {
    addProp({ kind: 'column', x: cx * TILE + 8, y: 16 * TILE + 14 });
    map.colliders.push({ x: cx * TILE + 1, y: 16 * TILE + 4, w: 14, h: 10 });
  }

  // things you bump into, and things you can sit on
  for (const p of map.props) {
    if (p.kind === 'plant') map.colliders.push({ x: p.x - 6, y: p.y - 9, w: 12, h: 9 });
    if (p.kind === 'statue') map.colliders.push({ x: p.x - 7, y: p.y - 15, w: 14, h: 15 });
    if (p.kind === 'vitrine') map.colliders.push({ x: p.x - 16, y: p.y - 11, w: 32, h: 11 });
    if (p.kind === 'bench') {
      // No collider: you sit *on* a bench, so walking into it has to be allowed.
      map.seats.push({ x: p.x, y: p.y - 6, label: 'Bench' });
    }
  }

  // draw order is fixed, so sort once rather than every frame
  map.props.sort((a, b) => a.y - b.y);
}

/** The wall sconces, drawn live each frame so their flames move. */
export function drawSconces(c, ox, oy, t) {
  SCONCES.forEach(([sx, ry], i) => {
    if (wallFaceDepth(sx, ry) !== 1) return;
    const x = sx * TILE + 8 - ox;
    const y = ry * TILE + 4 - oy;
    if (x < -20 || x > 20000 || y < -20) return;
    drawSconce(c, x, y, t, i);
  });
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
