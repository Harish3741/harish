// The phone's museum: the atrium, standing still.
//
// A phone cannot walk the building — a thumb is a bad D-pad — but it can stand
// in the middle of it and look around. So this is the atrium exactly as the
// desktop game draws it: the same map canvas, the same sprites, the same
// torches guttering on the wall, the droid hovering over the medallion. Only
// two things are different. The camera is nailed down, and the droid takes no
// input; it turns its head on its own and looks at the doorway you pick.
//
// The four arches are the menu. They are already labelled — the banners hang
// in them in the game — so nothing has to be written over the top of the room;
// the light coming through each opening and a brass bracket on its mouth are
// what say "this one is a door you can use". The tap targets themselves are
// real buttons laid over the canvas, so the four rooms are reachable by
// keyboard and announce themselves properly, which a canvas hotspot cannot.
//
// Going in is a fade rather than a cut: the lights go down on the atrium, and
// the wing's list comes up out of the black. That is the phone's version of
// walking through the arch.

import { COL } from './config.js';
import { SITE, WINGS } from './data/projects.js';
import {
  archBox, atriumFrame, map, drawProp, drawSconces, START_PX, WING_ROOMS,
} from './map.js';
import { player, spawnAt, updatePlayer, drawPlayer } from './player.js';
import { engrave } from './plate.js';
import { initListView, openWing, closeList } from './listview.js';

// The shot. Read off the map, so a wing that moves takes its doorway with it.
const FRAME = atriumFrame();

// How much of the atrium floor in front of an arch also counts as the arch.
// The mouth alone is a fine target, but the banner naming the room hangs just
// outside two of them, and a label you cannot press is a small lie.
const DOOR_REACH = 24;

// The scene never needs to be bigger than this many device pixels per drawn
// pixel. Past about six it stops reading as a room you are looking into and
// starts reading as four enormous rectangles.
const MAX_SCALE = 6;

// Going in: the droid looks, the lights go down, black holds, the list rises.
const TURN_MS = 260;
const FADE_MS = 520;
const HOLD_MS = 200;
const RISE_MS = 620;

let lobbyEl = null;
let stageEl = null;
let roomEl = null;
let titleCv = null;
let sceneCv = null;
let sceneCtx = null;
let curtainEl = null;

let doors = [];
let running = false;
let loopId = 0;
let lastTs = 0;
let busy = false;      // a fade is between the two screens right now
let inWing = false;    // which of them is up
let lastDoor = null;
let relayout = 0;
let chain = 0;

// Asked once and kept, because the draw loop reads it several times a frame.
const CALM = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Whoever asked for less motion gets a still room and cuts between screens. */
function still() {
  return CALM.matches;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

export function initLobby() {
  lobbyEl = document.getElementById('lobby');
  stageEl = lobbyEl.querySelector('.lobby-stage');
  roomEl = document.getElementById('lobby-room');
  titleCv = document.getElementById('lobby-title');
  sceneCv = document.getElementById('atrium');
  curtainEl = document.getElementById('curtain');
  sceneCtx = sceneCv.getContext('2d', { alpha: false });

  document.getElementById('lobby-name').textContent = `${SITE.name} — ${SITE.tagline}`;
  lobbyEl.querySelector('.lobby-tagline').textContent = SITE.tagline;
  lobbyEl.querySelector('.lobby-note').textContent = SITE.note || '';
  lobbyEl.querySelector('.lobby-credit').textContent = SITE.footer || '';

  // The stage is the shape of the shot, so the space around the room is the
  // page's margin rather than a hole the flex box had left over.
  stageEl.style.aspectRatio = `${FRAME.w} / ${FRAME.h}`;

  buildDoors();
  initListView({ standalone: true, onExit: leaveWing });

  // Standing on the medallion, facing the room. Same spot the game starts you.
  spawnAt(START_PX.x, START_PX.y, 'down');
  // Past the blink. The blink frame is the sprite with its visor off, and a
  // room that never advances the clock would hold the droid there, powered
  // down, for the whole visit.
  player.blink = 900;

  lobbyEl.hidden = false;
  layoutLobby();
  start();

  window.addEventListener('resize', queueLayout);
  window.addEventListener('orientationchange', queueLayout);

  // The lights come up on the atrium the way they go down on it.
  if (!still()) {
    curtainEl.hidden = false;
    curtainEl.style.transitionDuration = '0ms';
    curtainEl.classList.add('is-dark');
    requestAnimationFrame(() => fade(false, 700));
  }
}

function buildDoors() {
  doors = WINGS.filter((wing) => WING_ROOMS[wing.id]).map((wing) => {
    const room = WING_ROOMS[wing.id];
    const n = (wing.projects || []).length;
    const door = {
      id: wing.id,
      box: archBox(wing.id),
      // the north wings are up from the atrium, the south wings down
      facing: room.entry === 'south' ? 'up' : 'down',
      el: document.createElement('button'),
      down: false,
    };

    door.el.type = 'button';
    door.el.className = 'door';
    door.el.setAttribute(
      'aria-label',
      `${wing.title} — ${n} ${n === 1 ? 'exhibit' : 'exhibits'}`
    );
    door.el.addEventListener('click', () => enterWing(wing.id));
    door.el.addEventListener('pointerdown', () => { door.down = true; });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
      door.el.addEventListener(ev, () => { door.down = false; });
    }
    roomEl.appendChild(door.el);
    return door;
  });
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

function queueLayout() {
  cancelAnimationFrame(relayout);
  relayout = requestAnimationFrame(layoutLobby);
}

/**
 * Size the scene to the space it has been given.
 *
 * The scale is whole in *device* pixels, not CSS ones. A phone is 2x or 3x, so
 * four device pixels per drawn pixel is 1.33 CSS pixels — crisp on the glass
 * and near enough to filling the width. Insisting on whole CSS pixels would
 * leave the museum at a third of the size it could be, on exactly the screens
 * where it is the only thing to look at.
 */
function layoutLobby() {
  if (lobbyEl.hidden) return;

  // The name is cut first. A canvas with nothing drawn in it yet is 300x150,
  // which is 100px of heading that isn't there — and measuring the stage
  // against that put the room a hundred pixels above where it belonged.
  // The name is sized off the height of the screen, not just its width: a
  // phone on its side has plenty of the one and none of the other, and a 46px
  // HARISH over a 176px room is a title with a museum under it.
  engrave(titleCv, SITE.name, {
    cap: Math.max(20, Math.min(46, Math.round(window.innerHeight * 0.075))),
    color: COL.paper,
    shadow: 'rgba(0, 0, 0, 0.55)',
  });

  const box = stageEl.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  let s = Math.floor(Math.min(
    (box.width * dpr) / FRAME.w,
    (box.height * dpr) / FRAME.h
  ));
  s = Math.max(1, Math.min(MAX_SCALE, s));

  sceneCv.width = FRAME.w * s;
  sceneCv.height = FRAME.h * s;
  const cw = sceneCv.width / dpr;
  const ch = sceneCv.height / dpr;
  sceneCv.style.width = `${cw}px`;
  sceneCv.style.height = `${ch}px`;

  // The room is taken out of flow and placed by hand: measured against the
  // stage it sits in, it would resize the box it was just measured against.
  roomEl.style.width = `${cw}px`;
  roomEl.style.height = `${ch}px`;
  roomEl.style.left = `${Math.round((box.width - cw) / 2)}px`;
  roomEl.style.top = `${Math.round((box.height - ch) / 2)}px`;

  sceneCtx.setTransform(s, 0, 0, s, 0, 0);
  sceneCtx.imageSmoothingEnabled = false;

  const k = cw / FRAME.w;                    // CSS pixels per drawn pixel
  for (const door of doors) {
    const hot = reach(door);
    door.el.style.left = `${(hot.x - FRAME.x) * k}px`;
    door.el.style.top = `${(hot.y - FRAME.y) * k}px`;
    door.el.style.width = `${hot.w * k}px`;
    door.el.style.height = `${hot.h * k}px`;
  }

  if (!running) drawLobby(still() ? 0 : performance.now());
}

/** The arch, plus a strip of the floor in front of it. */
function reach(door) {
  const b = door.box;
  return door.facing === 'up'
    ? { x: b.x, y: b.y, w: b.w, h: b.h + DOOR_REACH }
    : { x: b.x, y: b.y - DOOR_REACH, w: b.w, h: b.h + DOOR_REACH };
}

/* ------------------------------------------------------------------ */
/* The droid, standing about                                           */
/* ------------------------------------------------------------------ */

// Not random: a fixed round of glances, which is enough to read as alive and
// cannot decide to stare at the wall for a minute.
const GLANCES = ['down', 'left', 'down', 'right', 'up', 'down'];
let glanceIx = 0;
let glanceLeft = 2.8;

function glance(dt) {
  glanceLeft -= dt;
  if (glanceLeft > 0) return;
  glanceIx = (glanceIx + 1) % GLANCES.length;
  player.dir = GLANCES[glanceIx];
  glanceLeft = 2.2 + (glanceIx % 3) * 0.8;
}

/* ------------------------------------------------------------------ */
/* Draw                                                                */
/* ------------------------------------------------------------------ */

// The loop carries a ticket. Stopping and starting inside one frame would
// otherwise leave the old callback alive alongside the new one, and the museum
// would be drawn twice a frame for the rest of the visit.
//
// It does not run at all for anyone who asked for less motion. A fade they can
// skip is one thing; a room that flickers, pulses and looks about forever, with
// nothing on the page to stop it, is exactly what the setting is for. They get
// the same room, lit and still.
function start() {
  if (running) return;
  if (still()) { paint(); return; }
  running = true;
  loopId += 1;
  lastTs = performance.now();
  const mine = loopId;
  requestAnimationFrame(function tick(ts) {
    if (!running || mine !== loopId) return;
    loopLobby(ts);
    requestAnimationFrame(tick);
  });
}

function stop() {
  running = false;
}

/** One frame of the still room, at a fixed moment so nothing is mid-flicker. */
function paint() {
  loopId += 1;                  // any loop still in flight gives up its ticket
  running = false;
  drawLobby(0);
}

// The setting can be changed while the page is open, and a room that keeps
// moving after you have asked it to stop is the whole complaint.
CALM.addEventListener('change', () => {
  if (lobbyEl && !lobbyEl.hidden) {
    if (still()) paint();
    else start();
  }
});

function loopLobby(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  glance(dt);
  updatePlayer(dt, false);       // never idle: the droid is on duty, not asleep
  drawLobby(ts);
}

function drawLobby(ts) {
  const c = sceneCtx;
  const ox = FRAME.x;
  const oy = FRAME.y;

  c.fillStyle = COL.sky;
  c.fillRect(0, 0, FRAME.w, FRAME.h);
  c.drawImage(map.canvas, ox, oy, FRAME.w, FRAME.h, 0, 0, FRAME.w, FRAME.h);

  drawSconces(c, ox, oy, ts);

  // the light coming through, under the banners rather than over them
  for (const door of doors) drawSpill(c, door, ts, ox, oy);

  const props = map.props;
  let i = 0;
  for (; i < props.length && props[i].y <= player.y; i++) {
    if (inFrame(props[i])) drawProp(c, props[i], ox, oy, ts);
  }
  drawPlayer(c, ox, oy);
  for (; i < props.length; i++) {
    if (inFrame(props[i])) drawProp(c, props[i], ox, oy, ts);
  }

  softEdges(c);

  // and the brackets on top of everything: they are the only part of this that
  // is a control rather than a room
  for (const door of doors) drawBracket(c, door, ts, ox, oy);
}

function inFrame(p) {
  const x = p.x - FRAME.x;
  const y = p.y - FRAME.y;
  const mx = 96 + (p.w || 0);
  const my = 64 + (p.h || 0);
  return x > -mx && x < FRAME.w + mx && y > -my && y < FRAME.h + my;
}

function isHot(door) {
  return door.down || document.activeElement === door.el;
}

/** The breath in the lit doorways — held open, not held still, for anyone who
 *  asked for less motion. */
function pulse(ts) {
  return still() ? 1 : (Math.sin(ts / 1100) + 1) / 2;
}

/** Light from the room beyond, in four hard bands. A smooth ramp would be the
 *  one thing in the building not made of pixels. */
function drawSpill(c, door, ts, ox, oy) {
  const b = door.box;
  const x = b.x - ox;
  const y = b.y - oy;
  const lit = isHot(door) ? 1.6 : 0.72 + pulse(ts) * 0.28;
  const band = b.h / 4;

  for (let i = 0; i < 4; i++) {
    const a = (0.30 - i * 0.075) * lit;
    if (a <= 0) continue;
    c.fillStyle = `rgba(255, 231, 183, ${a.toFixed(3)})`;
    const top = door.facing === 'up' ? y + i * band : y + b.h - (i + 1) * band;
    c.fillRect(x, Math.round(top), b.w, Math.ceil(band));
  }
}

/** The brass round the opening, and the chevron pointing through it. */
function drawBracket(c, door, ts, ox, oy) {
  const b = door.box;
  const x = b.x - ox;
  const y = b.y - oy;
  const up = door.facing === 'up';

  c.save();
  c.globalAlpha = isHot(door) ? 1 : 0.52 + pulse(ts) * 0.28;
  c.fillStyle = COL.brass;

  // Both jambs the whole depth of the opening, and only the corners of the
  // mouth. A closed rectangle round a doorway reads as a door that is shut;
  // two uprights and a pair of returns read as a way through.
  const ARM = 10;
  const lip = up ? y + b.h - 1 : y;
  c.fillRect(x, y, 1, b.h);
  c.fillRect(x + b.w - 1, y, 1, b.h);
  c.fillRect(x, lip, ARM, 1);
  c.fillRect(x + b.w - ARM, lip, ARM, 1);

  // and a chevron drifting into the room, two pixels thick so it survives
  // being three device pixels tall on a phone
  const bob = still() ? 0 : Math.round(Math.sin(ts / 560));
  const cx = x + Math.round(b.w / 2);
  const cy = up ? y + 2 - bob : y + b.h - 8 + bob;
  for (let k = 0; k < 5; k++) {
    const ky = up ? cy + k : cy + 5 - k;
    for (let t = 0; t < 2; t++) {
      c.fillRect(cx - k, ky + (up ? t : -t), 1, 1);
      c.fillRect(cx + k, ky + (up ? t : -t), 1, 1);
    }
  }

  c.restore();
}

/**
 * The edges fall away. Not only for the look of it: the shot is cropped to the
 * atrium's own floor, so the top and bottom rows of it are the far sides of
 * walls that belong to the rooms beyond — a boardroom's plaster and a cinema's
 * black panelling, seen from behind. In the game you walk past that and never
 * look at it. Here it is a fixed shot, so it is put in shadow, and what stays
 * lit is the floor, the droid and the four ways off it.
 */
function softEdges(c) {
  const g = c.createRadialGradient(
    FRAME.w / 2, FRAME.h / 2, FRAME.h * 0.30,
    FRAME.w / 2, FRAME.h / 2, FRAME.w * 0.64
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(18, 12, 8, 0.72)');
  c.fillStyle = g;
  c.fillRect(0, 0, FRAME.w, FRAME.h);

  const deep = 26;
  for (const top of [true, false]) {
    const v = c.createLinearGradient(0, top ? 0 : FRAME.h, 0, top ? deep : FRAME.h - deep);
    v.addColorStop(0, 'rgba(18, 12, 8, 0.62)');
    v.addColorStop(1, 'rgba(18, 12, 8, 0)');
    c.fillStyle = v;
    c.fillRect(0, top ? 0 : FRAME.h - deep, FRAME.w, deep);
  }
}

/* ------------------------------------------------------------------ */
/* Going in, and coming back out                                       */
/* ------------------------------------------------------------------ */

/**
 * The whole transition is one chain of waits, and only ever one of them is
 * pending — so there is one timer, and scheduling a step cancels whatever was
 * still owed. Without that, the 700ms lights-up on arrival was still counting
 * when a quick first tap started the lights-down, and its completion — hide the
 * curtain — landed on a curtain that had just been told to go black. The lights
 * never went down on the atrium, the wing cut in, and then the black rose over
 * the wing and faded off it: the whole cinematic, backwards, on the wrong
 * screen.
 */
function step(ms, fn) {
  window.clearTimeout(chain);
  chain = window.setTimeout(fn, ms);
}

/** Raise or drop the black. `ms` is how long it should take. */
function fade(dark, ms, done) {
  curtainEl.hidden = false;
  curtainEl.style.transitionDuration = `${ms}ms`;
  // a curtain that was display:none a moment ago has nothing to animate from
  void curtainEl.offsetWidth;
  curtainEl.classList.toggle('is-dark', dark);
  step(ms, () => {
    if (!dark) curtainEl.hidden = true;
    if (done) done();
  });
}

/**
 * `busy` covers the walk, not the whole cinematic: it is set on the tap and
 * released the moment the destination is on screen, which is 800ms before the
 * black has finished lifting off it. Held for the full sequence, the Back
 * button on a wing you were already looking at did nothing for a further
 * 620ms — visible, enabled, on top of the hit stack, and dead. A tap that
 * lands during the rise now simply takes the fade over, because `fade` owns
 * its timer.
 */
function enterWing(id) {
  if (busy || inWing) return;
  busy = true;

  lastDoor = doors.find((d) => d.id === id) || null;
  if (lastDoor) {
    // look at the door you picked before the lights go
    player.dir = lastDoor.facing;
    glanceLeft = (TURN_MS + FADE_MS) / 1000 + 1;
  }

  // The doors are not disabled while this runs — `busy` already refuses a
  // second tap, and disabling the button you just pressed drops focus on the
  // floor, so a keyboard visitor spent the whole transition on <body>.

  const show = () => {
    stop();
    lobbyEl.hidden = true;
    document.body.classList.add('is-inside');
    openWing(id);
    inWing = true;
    busy = false;
  };

  if (still()) { show(); return; }

  step(TURN_MS, () => fade(true, FADE_MS, () => {
    show();
    step(HOLD_MS, () => fade(false, RISE_MS));
  }));
}

/** The Back button at the head and foot of a wing. */
function leaveWing() {
  if (busy || !inWing) return;
  busy = true;

  const show = () => {
    closeList();
    document.body.classList.remove('is-inside');
    lobbyEl.hidden = false;
    layoutLobby();
    start();
    inWing = false;
    busy = false;
    // back where you were standing, not at the top of the page
    if (lastDoor) lastDoor.el.focus({ preventScroll: true });
  };

  if (still()) { show(); return; }

  fade(true, FADE_MS, () => {
    show();
    step(HOLD_MS, () => fade(false, RISE_MS));
  });
}
