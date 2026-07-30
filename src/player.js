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
};

// Half-extents of the collision box at the droid's base.
const HW = 6;
const HH = 4;

export function spawn(tx, ty, dir = 'up') {
  player.x = tx * TILE + TILE / 2;
  player.y = ty * TILE + TILE;
  player.dir = dir;
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

export function updatePlayer(dt) {
  player.t += dt * 1000;
  player.blink = (player.blink + dt * 1000) % 3600;
}

/** How far off the floor the droid is sitting right now, in pixels. */
export function hoverLift() {
  const period = player.moving ? 380 : 900;
  const amp = player.moving ? 2 : 1.4;
  return 2 + Math.round(Math.sin(player.t / period) * amp);
}

export function drawPlayer(ctx, ox = 0, oy = 0) {
  const lift = hoverLift();
  const blinking = player.blink < 110;

  let sprite;
  if (player.dir === 'up') sprite = SPRITES.droid.up;
  else if (player.dir === 'down') sprite = blinking ? SPRITES.droid.downBlink : SPRITES.droid.down;
  else if (player.dir === 'left') sprite = blinking ? SPRITES.droid.leftBlink : SPRITES.droid.left;
  else sprite = blinking ? SPRITES.droid.rightBlink : SPRITES.droid.right;

  const px = Math.round(player.x - ox);
  const py = Math.round(player.y - oy);

  drawDroidShadow(ctx, px, py - 2, lift);

  // exhaust motes when moving
  if (player.moving) {
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
