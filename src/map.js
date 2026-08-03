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
  drawMarble, drawWood, drawCarpet, drawStone, drawCarpetTile,
  drawWallTop, drawWallFace, drawWallShadow, drawSideShadow,
  drawFloorBorder, drawThreshold,
  drawPlinth, drawPlinthIcon, drawPlant, drawBench, drawRopeLine,
  drawLightPool, drawInlay, drawBanner, drawNotice, drawLectern, drawSideFrame,
  drawVitrine, drawStatue, drawRug, drawSconce, drawBoardTable, drawDownlight,
  drawMachine, drawBelt, drawPipeRun, drawHazardLine, drawDrums,
  drawScreen, drawCinemaSeat, drawPerson,
} from './art.js';
import { drawTextCentered, textWidth } from './font.js';
import {
  PAINTINGS, ABOUT, RESUME, RULES, CLIENTS, wingById,
} from './data/projects.js';

export const MAP_W = 40;
export const MAP_H = 33;

// Rooms are an odd number of tiles wide and arches an odd number too, so both
// centre on a tile rather than a tile boundary. That is what lets every arch
// line up exactly with the plinth behind it: you come through the opening and
// the exhibit is straight ahead, with nothing to steer around.
//
// [x, y, w, h]
// The atrium is five deep and sixteen across: deep enough for the compass with
// the résumé above it and the lectern below, narrow enough that its two arches
// sit at its corners rather than marooned in the middle of a long wall.
//
// The wings are six deep. When they lost a row the north pair gave theirs up
// at the top and the south pair at the bottom, so both arches — and the wall
// thicknesses either side of them — are exactly where they were.
const REGIONS = [
  { rect: [10, 5, 9, 6], floor: 'stone', indoor: true, wing: 'automations', theme: 'plant' },
  { rect: [21, 5, 9, 6], floor: 'wood', indoor: true, wing: 'personal' },
  { rect: [12, 14, 16, 5], floor: 'marble', indoor: true },
  { rect: [10, 22, 9, 6], floor: 'office', indoor: true, wing: 'client', theme: 'office' },
  { rect: [21, 22, 9, 6], floor: 'carpet', indoor: true, wing: 'about', theme: 'theatre' },

  // Arches through the shared walls: five tiles wide, three deep because that
  // is how thick the walls are. These replaced the old connecting corridors.
  { rect: [12, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [23, 11, 5, 3], floor: 'marble', indoor: true },
  { rect: [12, 19, 5, 3], floor: 'marble', indoor: true },
  { rect: [23, 19, 5, 3], floor: 'marble', indoor: true },
];

// The building's footprint. Every tile inside it that isn't floor is solid
// masonry, which is what fills the courtyards between the wings — a radius
// around each room can't, because those courtyards open onto the map edge.
// It reaches y=0 so the north wings get a full three-tile-tall wall above them.
const MASONRY = [0, 0, 40, 33];

// Each wing gets its own accent, used on its rug, its vitrines and the icon
// floating in its case, so the four rooms don't read as one room repeated.
// Deep and desaturated on purpose: a large saturated rectangle on the floor
// reads as a hole rather than a carpet.
//
// `cx` is the room's centre tile across, which is all that has to be a whole
// tile — that is what lines an arch up with what is behind it. Everything
// vertical comes from roomBox(), off the rectangle in REGIONS, so a room can
// change height without a dozen offsets going quietly stale.
//
// `entry` is the side the arch is on. Furniture that would otherwise sit in
// the doorway goes to the opposite side of the plinth.
export const WING_ROOMS = {
  automations: {
    cx: 14, entry: 'south', rail: 3, label: 'Automations', banner: 'AUTOMATIONS',
    accent: '#2E4A52', machineHall: true,
  },
  personal: {
    cx: 25, entry: 'south', rail: 3, label: 'Initiatives', banner: 'INITIATIVES',
    accent: '#6B3F28',
  },
  client: {
    cx: 14, entry: 'north', rail: 20, label: 'Projects', banner: 'PROJECTS',
    accent: '#2F3A55', boardroom: true,
  },
  about: {
    cx: 25, entry: 'north', rail: 20, label: 'About Me', banner: 'ABOUT ME',
    accent: '#33373C', theatre: true,
  },
};

// The row of each wall that carries pictures and sconces (the "picture field",
// two tiles above the floor it stands on).
const RAIL = { northWings: 3, atrium: 12, southWings: 20 };

// Wall sconces: [tile x, rail row]. Their pools are painted with the rest of
// the lighting, before the walls go down, so the glow can't spill onto plaster.
const SCONCES = [
  ...[12, 16, 23, 27].map((x) => [x, RAIL.northWings]),
  // the atrium is sixteen wide, so its end wall only shows either side of
  // the résumé — x11 and x28 are its side walls now, seen from above
  ...[18, 21].map((x) => [x, RAIL.atrium]),
  // Neither south wing takes a torch: the cinema is dark on purpose and the
  // boardroom is lit by the downlights dressBoardroom paints on its wall.
];

// Arch mouths, for the brass thresholds laid across them.
const THRESHOLDS = [
  [12, 13, 5], [23, 13, 5],   // atrium -> north wings
  [12, 19, 5], [23, 19, 5],   // atrium -> south wings
];

// The building's centre line, and where you start. The atrium's middle row is
// 16: everything laid out in it — compass, résumé, lectern — hangs off that.
const AXIS = 320;
const ATRIUM_MID = 16;
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

  // 3. A plinth in the middle of every wing that is still a gallery. The
  //    screening room and the boardroom have people in them instead, and a
  //    plinth in either would be standing in the middle of the furniture.
  for (const [id, w] of Object.entries(WING_ROOMS)) {
    if (w.theatre || w.boardroom || w.machineHall) continue;
    const box = roomBox(id);
    const px = box.cx;
    const py = box.cy + 8;
    map.plinths.push({ id, x: px, y: py, label: w.label, accent: w.accent, top: py - 30 });
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
 * A wing's floor in pixels, read off the rectangle that defines it rather than
 * from offsets typed next to the furniture. The rooms have been resized four
 * times now and every hand-written offset went stale silently each time — this
 * is the one place that knows where a room's edges and centre actually are.
 */
function roomBox(id) {
  const [rx, ry, rw, rh] = REGIONS.find((r) => r.wing === id).rect;
  return {
    x0: rx * TILE,
    y0: ry * TILE,
    x1: (rx + rw) * TILE,
    y1: (ry + rh) * TILE,
    cx: rx * TILE + (rw * TILE) / 2,
    cy: ry * TILE + (rh * TILE) / 2,
  };
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
      else if (f === 'stone') drawStone(c, px, py, x, y);
      else if (f === 'office') drawCarpetTile(c, px, py, x, y);
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
  drawLightPool(c, AXIS - 80, ATRIUM_MID * TILE - 24, 160, 64, 0.55);
  for (const [id, w] of Object.entries(WING_ROOMS)) {
    // no skylight over a cinema — the screen is the only light in that room
    if (w.theatre) continue;
    const box = roomBox(id);
    drawLightPool(c, box.cx - 56, box.cy - 40, 112, 80);
  }
  for (const [sx, ry] of SCONCES) {
    if (wallFaceDepth(sx, ry) !== 1) continue;
    drawLightPool(c, sx * TILE - 20, (ry + 2) * TILE, 56, 40, 0.8);
  }

  // The compass is sized to the room: at five rows deep it has to share the
  // floor with the lectern standing at the foot of it.
  drawInlay(c, AXIS, ATRIUM_MID * TILE + 8, 16);
  for (const [id, w] of Object.entries(WING_ROOMS)) {
    if (w.machineHall) continue;   // a plant room has a painted floor, not a rug
    const box = roomBox(id);
    // the boardroom's rug turns with its table, so it frames it rather than
    // letting both ends of the table hang off the edge
    const [rw, rh] = w.boardroom ? [3, 4] : [5, 3];
    drawRug(c, box.cx, box.cy, rw * TILE, rh * TILE, w.accent);
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

// Every frame on every wall can be walked up to and read, whether or not
// there is a caption behind it yet. A frame that swallows the keypress teaches
// you not to bother pressing E at the next one.
const EMPTY_FRAME = {
  title: 'Untitled',
  caption: 'Nothing hung here yet. Give this frame a title and a caption in '
    + 'PAINTINGS in src/data/projects.js — its slot is the position it hangs '
    + 'in, left to right along the wall.',
};

/** Anything standing on the floor is depth-sorted, so the droid can pass behind it. */
function addProp(p) {
  map.props.push(p);
}

function decorate(c) {
  // ---- baked: wall-mounted, and flat on the ground ----

  // No wing hangs pictures any more: the machine hall has pipework, the
  // boardroom downlights, the cinema a screen, and Initiatives its plinth and
  // benches. The eight frames left in the building are the atrium's.
  dressAtrium(c);

  // ---- depth-sorted props ----

  for (const p of map.plinths) {
    if (p.bare) continue;   // machines and the boardroom table are their own prop
    addProp({ kind: 'plinth', x: p.x, y: p.y, id: p.id });
  }

  // A wing's name hangs in the walkway between the atrium and the room — the
  // middle of the arch, which is three tiles deep — rather than on either room's
  // floor. It belongs to the opening it spans, you walk under it going in and
  // coming out, and neither the atrium's end wall nor the room itself has to
  // give up space to it.
  const ARCH = 3 * TILE;
  for (const [id, w] of Object.entries(WING_ROOMS)) {
    const box = roomBox(id);
    const mouth = w.entry === 'south' ? box.y1 : box.y0 - ARCH;
    const toward = w.entry === 'south' ? 1 : -1;   // which way the atrium lies
    addProp({
      kind: 'banner',
      x: box.cx,
      // centred in the walkway, then a tile toward the atrium: hung at the end
      // you read it from. 22 is the rail plus the cloth.
      y: mouth + Math.round((ARCH - 22) / 2) + toward * TILE,
      text: w.banner,
      accent: w.accent,
    });
  }

  for (const [id, w] of Object.entries(WING_ROOMS)) {
    if (w.theatre) { dressTheatre(c, w, roomBox(id)); continue; }
    if (w.boardroom) { dressBoardroom(c, w, roomBox(id)); continue; }
    if (w.machineHall) { dressMachineHall(c, w, roomBox(id)); continue; }

    const box = roomBox(id);
    const front = w.entry === 'south' ? 1 : -1;   // toward the arch

    // flanking the plinth, clear of the arch's five-tile span
    addProp({ kind: 'statue', x: box.cx - 48, y: box.cy + 2 });
    addProp({ kind: 'statue', x: box.cx + 48, y: box.cy + 2 });
    addProp({ kind: 'rope', x: box.cx - 32, y: box.cy + front * 18, span: 4 * TILE });

    // A pair of benches by the entry wall, pushed out past the arch's five-tile
    // span so neither sits in the doorway. They also have to stay outside the
    // plinth's interact radius, or pressing E at a bench opens the exhibit list
    // instead of sitting you down.
    const benchY = front > 0 ? box.y1 - 10 : box.y0 + 26;
    for (const side of [-1, 1]) {
      addProp({ kind: 'bench', x: box.cx + side * 56, y: benchY });
    }

    // Planting along the back wall only. At six rows deep the corners by the
    // entry belong to the benches, and a plant there overlaps one.
    for (const sx of [-64, 64]) {
      addProp({ kind: 'plant', x: box.cx + sx, y: front > 0 ? box.y0 + 16 : box.y1 - 8 });
    }
  }

  // things you bump into, and things you can sit on
  for (const p of map.props) {
    if (p.kind === 'plant') map.colliders.push({ x: p.x - 6, y: p.y - 9, w: 12, h: 9 });
    if (p.kind === 'statue') map.colliders.push({ x: p.x - 7, y: p.y - 15, w: 14, h: 15 });
    if (p.kind === 'vitrine') map.colliders.push({ x: p.x - 16, y: p.y - 11, w: 32, h: 11 });
    // Benches are decoration. They used to be sittable, which meant no
    // collider — you cannot walk into something you sit on — so now that they
    // are not, they get one and stop being furniture you stroll through.
    if (p.kind === 'bench') map.colliders.push({ x: p.x - 12, y: p.y - 8, w: 24, h: 8 });
  }

  // draw order is fixed, so sort once rather than every frame
  map.props.sort((a, b) => a.y - b.y);
}

/**
 * The machine hall. The Automations wing is a plant room rather than a gallery:
 * a row of machines against the back wall, a conveyor running past their feet
 * with crates on it, pipework overhead and a safety line painted on the floor.
 *
 * Five machines, and all five respond: three in a row behind the belt, two more
 * standing against the side walls where you come in. Five is the number the
 * room is built for, so the content file ships five slots; a slot with nothing
 * in it still opens, and says so, rather than being a machine you press E at
 * and nothing happens.
 *
 * You read a machine from the near side of the belt — close enough to read the
 * panel, not close enough to lose a hand.
 */
function dressMachineHall(c, w, box) {
  const wing = wingById('automations');
  const projects = (wing && wing.projects) || [];

  const left = box.x0 + 8;
  const run = box.x1 - box.x0 - 16;
  const beltH = 16;
  const beltY = box.cy - 12;               // top of the belt
  const floorY = beltY - 4;                // where the back row stands

  // pipework along the wall, in place of pictures
  drawPipeRun(c, left, w.rail * TILE + 8, run, w.cx);

  // the safety line, painted on the near side of the belt
  drawHazardLine(c, left, beltY + beltH + 6, run);

  addProp({ kind: 'belt', x: left, y: beltY + beltH, w: run, h: beltH });
  map.colliders.push({ x: left, y: beltY, w: run, h: beltH });

  // Three machines behind the belt, wired to each other. Any of them opens the
  // wing's whole list — they are one plant, not three exhibits, and picking a
  // flow off a list beats walking between cabinets to find it.
  //
  // They read from the safety line, which is why the interact point is the
  // belt's near edge and not the cabinet: measured from the cabinet, the belt
  // pushes you far enough back to fall out of range.
  //
  // They spread across the run rather than bunching in the middle. They were
  // bunched when two more machines stood by the door and the interact radius
  // kept picking the wrong one; now that all three open the same list, their
  // radii can overlap as much as they like.
  const mw = 24;
  const pitch = run / 3;
  for (let i = 0; i < 3; i++) {
    const mx = Math.round(left + pitch * (i + 0.5));
    addProp({
      kind: 'machine', x: mx, y: floorY, w: mw, seed: i + 1,
      accent: w.accent, running: projects.length > 0,
    });
    map.colliders.push({ x: mx - mw / 2, y: floorY - 10, w: mw, h: 10 });
    map.plinths.push({
      id: 'automations',
      x: mx,
      y: beltY + beltH,
      label: w.label,
      accent: w.accent,
      bare: true,            // the machine is the prop; no plinth stands here
      top: floorY - 30,      // the top of the cabinet behind the belt
      promptX: box.cx,       // one bubble, over the middle of the line
    });
  }

  // Stock at either end of the line, where two more machines used to stand.
  // Three cabinets is the plant; the drums are what it is fed and what it
  // fills, and they fill the corners by the door without asking to be pressed.
  for (const bx of [box.x0 + 16, box.x1 - 16]) {
    addProp({ kind: 'drums', x: bx, y: box.y1 - 8, seed: bx });
    map.colliders.push({ x: bx - 13, y: box.y1 - 20, w: 26, h: 12 });
  }
}

/**
 * The boardroom. A table end-on to the door with three clients standing round
 * it. The table is what you press: the clients used to be three separate
 * conversations, which meant walking round the table to find a particular
 * project. One list at the table is quicker to read and quicker to leave, and
 * the three of them are still who the room is about.
 *
 * Turned end-on the table leaves close to three tiles of clear floor down each
 * side instead of two, so getting round it is a walk rather than a squeeze.
 */
function dressBoardroom(c, w, box) {
  // Downlights rather than torches. A boardroom lit by an open flame was the
  // one thing in the building that read as a mistake instead of a choice.
  for (const d of [-3, 3]) {
    drawDownlight(c, (w.cx + d) * TILE + 8, w.rail * TILE + 7);
  }

  const table = { w: 2 * TILE, h: 3 * TILE };
  addProp({ kind: 'table', x: box.cx, y: box.cy, w: table.w, h: table.h });
  map.colliders.push({
    x: box.cx - table.w / 2 - 7,          // the tucked-in chairs, too
    y: box.cy - table.h / 2,
    w: table.w + 14,
    h: table.h,
  });
  map.plinths.push({
    id: 'client',
    x: box.cx,
    y: box.cy,
    label: w.label,
    accent: w.accent,
    bare: true,      // the table is the prop
    top: box.cy - table.h / 2 - 8,
  });

  // One client down each side and one at the far head, all three decoration.
  // The near head is left open: it is where you come in, and where you stand.
  const spots = [
    { x: box.cx - table.w / 2 - 20, y: box.cy },
    { x: box.cx + table.w / 2 + 20, y: box.cy },
    { x: box.cx, y: box.cy + table.h / 2 + 14 },
  ];
  CLIENTS.slice(0, spots.length).forEach((client, i) => {
    const at = spots[i];
    addProp({ kind: 'person', x: at.x, y: at.y, seed: i + 2, who: `client${i}` });
    map.colliders.push({ x: at.x - 6, y: at.y - 10, w: 12, h: 10 });
  });
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
    top: RAIL.atrium * TILE + 2,
  });

  // The lectern below it, on the last row of floor. It has to go that low: the
  // book stands 27px up from its foot, and any higher would park it in the
  // middle of the compass rather than at the foot of it.
  const lx = AXIS;
  const ly = (ATRIUM_MID + 2) * TILE + 14;
  addProp({ kind: 'lectern', x: lx, y: ly });
  // The block is the foot, not the whole drawn height — a lectern is tall, and
  // blocking all of it would leave a sliver of floor to read it from.
  map.colliders.push({ x: lx - 9, y: ly - 10, w: 18, h: 10 });
  map.documents.push({
    x: lx, y: ly, label: 'The rules', blurb: 'Open on the lectern', doc: RULES,
    top: ly - 28,
  });

  // Two pictures down each side wall, each level with the one opposite. Two,
  // not three: the frames run up to 30px tall and a five-row wall can't take a
  // third without them touching.
  const captions = (PAINTINGS && PAINTINGS.atrium) || [];
  let slot = 0;
  for (const [side, wallX] of [['w', 12 * TILE], ['e', 28 * TILE]]) {
    for (const row of [ATRIUM_MID - 1, ATRIUM_MID + 1]) {
      const y = row * TILE + 8;
      drawSideFrame(c, wallX, y, side, row * 7 + slot);
      const info = captions[slot] || EMPTY_FRAME;
      map.artworks.push({
        x: wallX + (side === 'w' ? 22 : -22),
        y,
        title: info.title,
        caption: info.caption,
        image: info.image || null,
        label: 'Painting',
        top: y - 17,
      });
      slot += 1;
    }
  }
}

/**
 * The screening room. Screen on the west wall, a single armchair facing it, and
 * whoever is standing by the door on the right. No plinth: the person is the
 * "about me" and the chair is the film.
 */
function dressTheatre(c, w, box) {
  const westWall = box.x0;
  const roomTop = box.y0;
  const roomBottom = box.y1;

  // a little extra gloom, so the screen has something to be brighter than
  c.fillStyle = 'rgba(8, 10, 12, 0.14)';
  c.fillRect(westWall, roomTop, box.x1 - box.x0, roomBottom - roomTop);

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
    cy: box.cy,
  };
  map.screen = screen;
  addProp({ kind: 'screen', x: screen.x, y: screen.y, w: screen.w, h: screen.h });
  // one block for the lot: the screen, and the curtains hanging proud of it
  map.colliders.push({ x: westWall, y: roomTop, w: 30, h: screen.h });

  // One seat facing the screen, a square above the middle of the rug. The
  // chair's body runs 28px above its anchor and 1px below, so the anchor sits
  // 14 below the point its silhouette has to centre on.
  const seat = { x: box.cx, y: box.cy + 14 - TILE };
  addProp({ kind: 'cinemaseat', x: seat.x, y: seat.y, facing: 'left' });
  // You sit level with the chair rather than behind it, so the droid draws on
  // top of the seat instead of vanishing into it, forward of the back and
  // turned to face the screen.
  map.seats.push({
    x: seat.x - 3, y: seat.y, label: 'Seat', theatre: true, facing: 'left',
    top: seat.y - 29,
  });

  // whoever is standing by the door, on the right as you come in
  const person = {
    x: box.cx + 48,
    y: box.y0 + 32,
    label: (ABOUT && ABOUT.name) || 'About Me',
    wing: 'about',
    top: box.y0 + 32 - 18,
  };
  map.people.push(person);
  addProp({ kind: 'person', x: person.x, y: person.y, seed: 1, who: 'about' });
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
    case 'person': drawPerson(c, x, y, t, p.seed || 0, p.who || 'default'); break;
    case 'table': drawBoardTable(c, x, y, p.w, p.h); break;
    case 'machine': drawMachine(c, x, y, p.w, p.seed, t, p.accent, p.running); break;
    case 'belt': drawBelt(c, x, y - p.h, p.w, p.h, t); break;
    case 'drums': drawDrums(c, x, y, p.seed || 0); break;
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
