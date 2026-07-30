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
//     │            ▤ résumé              │
//     │             ATRIUM               │     you start here
//     │             ▢ rules              │
//     └─────┰──────────────────────┰─────┘
//     ┌─────┸─────┐          ┌─────┸─────┐
//     │  CLIENT   │          │ ABOUT ME  │     south wings
//     └───────────┘          └───────────┘
//
// There is no way in or out. The museum is the whole world, you begin in the
// middle of it, and every room is a few seconds away.

import { TILE, COL, THEATRE } from './config.js';
import {
  drawMarble, drawWood, drawCarpet,
  drawWallTop, drawWallFace, drawWallShadow, drawSideShadow,
  drawFloorBorder, drawThreshold,
  drawPlinth, drawPlinthIcon, drawFrame, drawPlant, drawBench, drawRopeLine,
  drawLightPool, drawInlay, drawBanner, drawNotice, drawLectern, drawSideFrame,
  drawVitrine, drawStatue, drawRug, drawSconce,
  drawScreen, drawCinemaSeat, drawPerson,
} from './art.js';
import { drawTextCentered, textWidth } from './font.js';
import { PAINTINGS, ABOUT, RESUME, RULES } from './data/projects.js';

export const MAP_W = 40;
export const MAP_H = 36;

// Rooms are an odd number of tiles wide and arches an odd number too, so both
// centre on a tile rather than a tile boundary. That is what lets every arch
// line up exactly with the plinth behind it: you come through the opening and
// the exhibit is straight ahead, with nothing to steer around.
//
// [x, y, w, h]
// The atrium is seven deep rather than three: it has to hold the compass, the
// résumé above it and the lectern below without any of the three crowding the
// others. The extra four rows go on the south side and the south half of the
// building moves down with them, which keeps the north wings' wall thickness —
// and their picture rail — exactly as it was.
const REGIONS = [
  { rect: [10, 4, 9, 7], floor: 'wood', indoor: true, wing: 'automations' },
  { rect: [21, 4, 9, 7], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [11, 14, 18, 7], floor: 'marble', indoor: true },
  { rect: [10, 24, 9, 7], floor: 'wood', indoor: true, wing: 'client' },
  { rect: [21, 24, 9, 7], floor: 'carpet', indoor: true, wing: 'about', theme: 'theatre' },

  // Arches through the shared walls: five tiles wide, three deep because that
  // is how thick the walls are. These replaced the old connecting corridors.
  { rect: [12, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [23, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [12, 21, 5, 3], floor: 'marble', indoor: true },
  { rect: [23, 21, 5, 3], floor: 'marble', indoor: true },
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
  automations: { cx: 14, cy: 7, entry: 'south', rail: 2, label: 'Automations', accent: '#2E4A52' },
  personal: { cx: 25, cy: 7, entry: 'south', rail: 2, label: 'Personal Projects', accent: '#6B3F28' },
  client: { cx: 14, cy: 27, entry: 'north', rail: 22, label: 'Client Work', accent: '#2F3A55' },
  about: {
    cx: 25, cy: 27, entry: 'north', rail: 22, label: 'About Me',
    accent: '#33373C', theatre: true,
  },
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
  [232, 14 * TILE, 'AUTOMATIONS'],
  [408, 14 * TILE, 'PERSONAL'],
  [232, 21 * TILE, 'CLIENT WORK'],
  [408, 21 * TILE, 'ABOUT ME'],
];

// Wall sconces: [tile x, rail row]. Their pools are painted with the rest of
// the lighting, before the walls go down, so the glow can't spill onto plaster.
const SCONCES = [
  ...[12, 16, 23, 27].map((x) => [x, RAIL.northWings]),
  ...[11, 18, 21, 28].map((x) => [x, RAIL.atrium]),
  // x22 and x28 would land in the screening room, which has no torches
  ...[11, 17].map((x) => [x, RAIL.southWings]),
];

// Arch mouths, for the brass thresholds laid across them.
const THRESHOLDS = [
  [12, 13, 5], [23, 13, 5],   // atrium -> north wings
  [12, 21, 5], [23, 21, 5],   // atrium -> south wings
];

// The building's centre line, and where you start. The atrium's middle row is
// 17: everything laid out in it — compass, résumé, lectern — hangs off that.
const AXIS = 320;
const ATRIUM_MID = 17;
export const START_PX = { x: AXIS, y: ATRIUM_MID * TILE + 12 };

/* ------------------------------------------------------------------ */

export const map = {
  floor: new Array(MAP_W * MAP_H).fill(null),
  indoor: new Uint8Array(MAP_W * MAP_H),
  wing: new Array(MAP_W * MAP_H).fill(null),
  theme: new Array(MAP_W * MAP_H).fill(null),
  wall: new Uint8Array(MAP_W * MAP_H),
  canvas: null,
  plinths: [],
  props: [],
  colliders: [],
  artworks: [],   // framed pictures you can walk up to and read
  documents: [],  // the résumé on the wall, the rules on the lectern
  seats: [],      // benches you can sit on
  people: [],     // characters you can talk to
  screen: null,   // the cinema screen, if the theatre is built
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

/** The résumé or the rules, if you're standing at one. */
export function documentNear(px, py) {
  return nearest(map.documents, px, py, 28);
}

/** The bench you could sit on, or null. */
export function seatNear(px, py) {
  return nearest(map.seats, px, py, 26);
}

/** The person you're standing next to, or null. */
export function personNear(px, py) {
  return nearest(map.people, px, py, 30);
}

/**
 * Whatever pressing E would act on right here. Ordered by how deliberate the
 * approach has to be: a plinth is the point of the room, a picture needs you
 * standing at the wall, a bench is what is left.
 */
export function interactableNear(px, py) {
  return plinthNear(px, py) || personNear(px, py) || documentNear(px, py)
    || artworkNear(px, py) || seatNear(px, py);
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
        if (r.theme) map.theme[idx(x, y)] = r.theme;
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

  // 3. A plinth in the middle of every wing except the screening room, where
  //    the character and the chair do that job instead.
  for (const [id, w] of Object.entries(WING_ROOMS)) {
    if (w.theatre) continue;
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

/**
 * The centre of a wing, in pixels. `cx`/`cy` are the room's centre *tile*, so
 * the centre in pixels is the middle of that tile — not the tile's corner, and
 * not an eyeballed offset from it. Rugs and furniture are laid out from here.
 */
function roomCentre(w) {
  return { x: w.cx * TILE + 8, y: w.cy * TILE + 8 };
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
      else if (f === 'carpet') drawCarpet(c, px, py, x, y);
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
  drawLightPool(c, AXIS - 80, ATRIUM_MID * TILE - 32, 160, 80, 0.55);
  for (const w of Object.values(WING_ROOMS)) {
    // no skylight over a cinema — the screen is the only light in that room
    if (w.theatre) continue;
    drawLightPool(c, (w.cx - 3) * TILE, (w.cy - 3) * TILE, 7 * TILE, 7 * TILE);
  }
  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) !== 1) continue;
    drawLightPool(c, sx * TILE - 20, (ry + 2) * TILE, 56, 40, 0.8);
  }

  drawInlay(c, AXIS, ATRIUM_MID * TILE + 8, 21);
  for (const w of Object.values(WING_ROOMS)) {
    const mid = roomCentre(w);
    drawRug(c, mid.x, mid.y, 5 * TILE, 3 * TILE, w.accent);
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
      if (depth >= 0) {
        // the wall belongs to whichever room it faces into
        drawWallFace(c, x * TILE, y * TILE, depth, map.theme[idx(x, y + depth + 1)]);
      } else {
        drawWallTop(c, x * TILE, y * TILE, x, y);
      }
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
    if (w.theatre) continue;   // a cinema doesn't hang pictures
    const offsets = w.entry === 'south' ? [-3, -1, 1, 3] : [-4, -3, 3, 4];
    hangSymmetric(c, w.cx, w.rail, offsets, id);
  }
  dressAtrium(c);

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
    if (w.theatre) { dressTheatre(c, w); continue; }
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

/**
 * The atrium. A museum hangs its charter by the door; this one hangs the résumé
 * there instead — a single sheet on the wall above the compass — with the house
 * rules lying open on a lectern below it.
 *
 * The pictures go down the side walls. Those walls run away from the camera and
 * have no face to hang anything on, so they are drawn with the same cheated
 * perspective as the cinema screen. There were columns here before, which is
 * what the pictures replace.
 */
function dressAtrium(c) {
  // the résumé, dead centre above the compass
  drawNotice(c, AXIS, RAIL.atrium * TILE + 4);
  map.documents.push({
    x: AXIS,
    y: (RAIL.atrium + 2) * TILE + 14,     // the floor tile you read it from
    label: 'Resume',                      // the bitmap font has no accents
    blurb: 'On the wall',
    doc: RESUME,
  });

  // The lectern below it, with the rules open on it. The 6px drop clears the
  // book off the compass's brass ring — any higher and it reads as standing on
  // the inlay rather than at the foot of it.
  const lx = AXIS;
  const ly = (ATRIUM_MID + 3) * TILE + 6;
  addProp({ kind: 'lectern', x: lx, y: ly });
  // The block is the foot, not the whole drawn height — a lectern is tall, and
  // blocking all of it would leave a sliver of floor to read it from.
  map.colliders.push({ x: lx - 9, y: ly - 10, w: 18, h: 10 });
  map.documents.push({
    x: lx, y: ly, label: 'The rules', blurb: 'Open on the lectern', doc: RULES,
    lift: 52,   // the bubble clears the book rather than sitting on it
  });

  // three pictures down each side wall, each level with the one opposite
  const captions = (PAINTINGS && PAINTINGS.atrium) || [];
  let slot = 0;
  for (const [side, wallX] of [['w', 11 * TILE], ['e', 29 * TILE]]) {
    for (const row of [ATRIUM_MID - 2, ATRIUM_MID, ATRIUM_MID + 2]) {
      const y = row * TILE + 8;
      drawSideFrame(c, wallX, y, side, row * 7 + slot);
      const info = captions[slot];
      if (info) {
        map.artworks.push({
          x: wallX + (side === 'w' ? 22 : -22),
          y,
          title: info.title,
          caption: info.caption,
          image: info.image || null,
          label: 'Painting',
        });
      }
      slot += 1;
    }
  }
}

/**
 * The screening room. Screen on the west wall, a single armchair facing it, and
 * whoever is standing by the door on the right. No plinth: the person is the
 * "about me" and the chair is the film.
 */
function dressTheatre(c, w) {
  const mid = roomCentre(w);
  const westWall = (w.cx - 4) * TILE;      // inner face of the west wall
  const roomTop = (w.cy - 3) * TILE;
  const roomBottom = (w.cy + 4) * TILE;

  // a little extra gloom, so the screen has something to be brighter than
  c.fillStyle = 'rgba(8, 10, 12, 0.14)';
  c.fillRect(westWall, roomTop, 9 * TILE, 7 * TILE);

  // The screen is flush against the west wall and runs the full depth of the
  // room, stopping at the floor's edge so the wall above and below it still
  // reads as wall. The house curtains take the end tile at each end, drawn as
  // part of the screen so they overlap it rather than standing beside it.
  const screen = {
    x: westWall + 12,            // surround flush to the inner wall face
    y: roomBottom,
    w: 18,
    h: roomBottom - roomTop,
    cx: westWall + 46,           // where the camera looks when it plays
    cy: mid.y,
  };
  map.screen = screen;
  addProp({ kind: 'screen', x: screen.x, y: screen.y, w: screen.w, h: screen.h });
  // one block for the lot: the screen, and the curtains hanging proud of it
  map.colliders.push({ x: westWall, y: roomTop, w: 30, h: screen.h });

  // One seat facing the screen, landing dead centre of the medallion woven
  // into the middle of the rug. The chair's body runs 28px above its anchor
  // and 1px below, so the anchor sits 14 below the point it has to centre on.
  const seat = { x: mid.x, y: mid.y + 14 };
  addProp({ kind: 'cinemaseat', x: seat.x, y: seat.y, facing: 'left' });
  // You sit level with the chair rather than behind it, so the droid draws on
  // top of the seat instead of vanishing into it, forward of the back and
  // turned to face the screen.
  map.seats.push({
    x: seat.x - 3, y: seat.y, label: 'Seat', theatre: true, facing: 'left',
  });

  // whoever is standing by the door, on the right as you come in
  const person = {
    x: (w.cx + 3) * TILE + 8,
    y: (w.cy - 2) * TILE + 16,
    label: (ABOUT && ABOUT.name) || 'About Me',
    wing: 'about',
  };
  map.people.push(person);
  addProp({ kind: 'person', x: person.x, y: person.y, seed: 1 });
  map.colliders.push({ x: person.x - 6, y: person.y - 10, w: 12, h: 10 });
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
    case 'screen': drawScreen(c, x, y, p.w, p.h, t, !!map.screen.playing); break;
    case 'cinemaseat': drawCinemaSeat(c, x, y, p.facing); break;
    case 'person': drawPerson(c, x, y, t, p.seed || 0); break;
    case 'bench': drawBench(c, x, y); break;
    case 'rope': drawRopeLine(c, x, y, p.span); break;
    case 'lectern': drawLectern(c, x, y, t); break;
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
