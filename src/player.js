// The droid. Position is stored as the point it hovers *over* — the contact
// point on the floor — so shadows, collision and depth sorting all agree.

import { SPEED, TILE } from './config.js';
import { SPRITES, drawDroidShadow } from './art.js';
import { isBlocked } from './map.js';

export const player = {
  x: 0,
  y: 0,
  dir: 'up',
  moving: false,
  t: 0,
  blink: 0,
  idle: 0,        // seconds since the last input
  asleep: false,
  seat: null,     // the bench being sat on, if any
  wake: 0,        // counts down a little startle bounce on waking
};

// `y` is the droid's contact point on the floor, but the sprite sits 16px above
// it. The camera wants the middle of the sprite, not its feet — without this
// the droid renders low on screen, which at 4x scale is a very visible 50px.
export const FOCUS_DY = 10;

// How long you have to leave it alone before it powers down.
const SLEEP_AFTER = 9;

// Half-extents of the collision box at the droid's base.
const HW = 6;
const HH = 4;

export function spawnAt(px, py, dir = 'down') {
  player.x = px;
  player.y = py;
  player.dir = dir;
  player.seat = null;
  player.asleep = false;
  player.idle = 0;
}

/** The point the camera should hold in the middle of the screen. */
export function focusY() {
  return player.y - FOCUS_DY;
}

function free(x, y) {
  return !isBlocked(x - HW, y - HH)
    && !isBlocked(x + HW - 1, y - HH)
    && !isBlocked(x - HW, y - 1)
    && !isBlocked(x + HW - 1, y - 1);
}

/**
 * Move by an axis vector, sliding along walls rather than sticking to them.
 * @returns {boolean} whether the droid actually moved
 */
export function movePlayer(ax, ay, dt) {
  const dx = ax * SPEED * dt;
  const dy = ay * SPEED * dt;
  let moved = false;

  if (dx !== 0 && free(player.x + dx, player.y)) {
    player.x += dx;
    moved = true;
  }
  if (dy !== 0 && free(player.x, player.y + dy)) {
    player.y += dy;
    moved = true;
  }

  // face whichever axis is dominant; ties go to vertical, which reads better
  if (ax || ay) {
    if (Math.abs(ay) >= Math.abs(ax)) player.dir = ay < 0 ? 'up' : 'down';
    else player.dir = ax < 0 ? 'left' : 'right';
  }

  player.moving = moved && (ax !== 0 || ay !== 0);
  return moved;
}

/** Sit on, or get up from, a bench. */
export function toggleSeat(seat) {
  if (player.seat) {
    // stand up just in front of the bench, so you aren't left inside it
    player.y = player.seat.y + 14;
    player.seat = null;
    player.dir = 'down';
    return false;
  }
  player.seat = seat;
  player.x = seat.x;
  player.y = seat.y;
  player.dir = seat.facing || 'down';
  player.moving = false;
  return true;
}

/** Any input at all: wake up, and reset the idle clock. */
export function rouse() {
  player.idle = 0;
  if (player.asleep) {
    player.asleep = false;
    player.wake = 0.45;
  }
}

/** Walk toward a point. Used by the opening cinematic. Returns true on arrival. */
export function walkToward(tx, ty, dt, speed = SPEED) {
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1.5) {
    player.moving = false;
    return true;
  }
  const step = Math.min(dist, speed * dt);
  player.x += (dx / dist) * step;
  player.y += (dy / dist) * step;
  if (Math.abs(dy) >= Math.abs(dx)) player.dir = dy < 0 ? 'up' : 'down';
  else player.dir = dx < 0 ? 'left' : 'right';
  player.moving = true;
  return false;
}

export function updatePlayer(dt, active = true) {
  player.t += dt * 1000;
  player.blink = (player.blink + dt * 1000) % 3600;
  player.wake = Math.max(0, player.wake - dt);

  // Sitting still counts as being awake — you chose to sit there.
  if (!active || player.moving || player.seat) {
    player.idle = 0;
    return;
  }
  player.idle += dt;
  if (player.idle > SLEEP_AFTER) player.asleep = true;
}

/** How far off the floor the droid is sitting right now, in pixels. */
export function hoverLift() {
  // Asleep: settled on the floor, breathing very slowly.
  if (player.asleep) return Math.round(Math.sin(player.t / 1900) * 0.5);
  // Sat on a bench: resting on it, not hovering.
  if (player.seat) return 1 + Math.round(Math.sin(player.t / 1400) * 0.5);
  // Just woken: a startled hop that settles back down.
  const startle = player.wake > 0 ? Math.round(player.wake * 9) : 0;
  const period = player.moving ? 380 : 900;
  const amp = player.moving ? 2 : 1.4;
  return 2 + startle + Math.round(Math.sin(player.t / period) * amp);
}

export function drawPlayer(ctx, ox = 0, oy = 0) {
  const lift = hoverLift();
  // asleep, the visor is simply off — the blink frame is already that sprite
  const blinking = player.asleep || player.blink < 110;

  let sprite;
  if (player.dir === 'up') sprite = SPRITES.droid.up;
  else if (player.dir === 'down') sprite = blinking ? SPRITES.droid.downBlink : SPRITES.droid.down;
  else if (player.dir === 'left') sprite = blinking ? SPRITES.droid.leftBlink : SPRITES.droid.left;
  else sprite = blinking ? SPRITES.droid.rightBlink : SPRITES.droid.right;

  const px = Math.round(player.x - ox);
  const py = Math.round(player.y - oy);

  drawDroidShadow(ctx, px, py - 2, lift);

  if (player.asleep) {
    // a slow pulse from the antenna, the only sign it is still on
    const glow = (Math.sin(player.t / 1100) + 1) / 2;
    ctx.fillStyle = `rgba(232, 118, 58, ${0.25 + glow * 0.5})`;
    ctx.fillRect(px - 1, py - 16 - lift - 14, 2, 1);
  }

  // exhaust motes when moving
  if (player.moving && !player.asleep) {
    ctx.fillStyle = 'rgba(232, 118, 58, 0.5)';
    for (let i = 0; i < 3; i++) {
      const ph = ((player.t / 70) + i * 2.6) % 8;
      const back = player.dir === 'left' ? 1 : player.dir === 'right' ? -1 : 0;
      const backY = player.dir === 'up' ? 1 : player.dir === 'down' ? -1 : 0;
      const mx = px + back * (4 + ph);
      const my = py - 5 + backY * (2 + ph * 0.5) + (i % 2 ? 1 : -1);
      ctx.fillRect(Math.round(mx), Math.round(my), 1, 1);
    }
  }

  ctx.drawImage(sprite, px - 8, py - 16 - lift);
}
