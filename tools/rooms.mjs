// Re-renders the four room captures the phone shows at the head of a wing.
//
//   node tools/rooms.mjs            (with the folder served on :8123)
//     -> img/rooms/automations.png, personal.png, client.png, about.png
//
// They are not screenshots taken by hand. The page is loaded at a desktop size
// so the game builds its sprites and bakes its background, and then each room
// is blitted out of that same canvas with its own props drawn over it — the
// torches, the machines, the clients round the table, the cinema screen.
//
// The one thing left out is the droid. drawPlayer is a separate call from the
// props, so simply not making it gives an empty room: on a phone the droid is
// already standing in the atrium above these pictures, and a second one asleep
// in the corner of every one of them was one droid too many.
//
// Needs a browser, because the art is drawn by canvas code that expects one.
// Playwright and Chromium are the only things this file wants that the site
// itself does not, which is why it lives here and not in src/.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A global Playwright is not on the ESM resolver's path, so one can be named
 * outright:  PLAYWRIGHT=$(npm root -g)/playwright/index.mjs node tools/rooms.mjs
 */
async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    if (process.env.PLAYWRIGHT) return import(process.env.PLAYWRIGHT);
    throw new Error(
      'tools/rooms.mjs needs Playwright. Either `npm i -D playwright`, or point '
      + 'at an existing one: PLAYWRIGHT=$(npm root -g)/playwright/index.mjs'
    );
  }
}

const { chromium } = await loadPlaywright();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.env.SITE || 'http://localhost:8123/index.html';

// Room rectangles in tiles, matching REGIONS in src/map.js. Only the corner is
// needed: every wing is the same size.
const ROOMS = {
  automations: [10, 5],
  personal: [21, 5],
  client: [10, 22],
  about: [21, 22],
};

// 160x110 of museum at three times life size. The room itself is 144x96, so
// this is the room plus a little masonry either side and the wall face above
// it — which is what tells you the picture is of a room and not of a floor.
const VIEW = { w: 160, h: 110, scale: 3, bleedX: 8, bleedY: 14 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const failures = [];
page.on('pageerror', (e) => failures.push(String(e)));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(async () => {
  const { map } = await import('/src/map.js');
  return Boolean(map && map.canvas);
});

const shots = await page.evaluate(async ({ rooms, view }) => {
  const { map, drawProp, drawSconces } = await import('/src/map.js');
  const { TILE, COL } = await import('/src/config.js');
  const out = {};

  for (const [id, [rx, ry]] of Object.entries(rooms)) {
    const ox = rx * TILE - view.bleedX;
    const oy = ry * TILE - view.bleedY;

    const cv = document.createElement('canvas');
    cv.width = view.w * view.scale;
    cv.height = view.h * view.scale;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.setTransform(view.scale, 0, 0, view.scale, 0, 0);

    c.fillStyle = COL.sky;
    c.fillRect(0, 0, view.w, view.h);
    c.drawImage(map.canvas, ox, oy, view.w, view.h, 0, 0, view.w, view.h);

    // A fixed moment, so the flames and the conveyor are the same every run
    // and re-rendering does not churn four files for nothing.
    drawSconces(c, ox, oy, 0);
    for (const prop of map.props) {
      const x = prop.x - ox;
      const y = prop.y - oy;
      if (x < -160 || x > view.w + 160 || y < -120 || y > view.h + 120) continue;
      drawProp(c, prop, ox, oy, 0);
    }
    // and no drawPlayer: that is the whole point

    out[id] = cv.toDataURL('image/png');
  }
  return out;
}, { rooms: ROOMS, view: VIEW });

for (const [id, url] of Object.entries(shots)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  const at = join(ROOT, 'img', 'rooms', `${id}.png`);
  writeFileSync(at, buf);
  console.log(`img/rooms/${id}.png  ${(buf.length / 1024).toFixed(0)} KB`);
}

await browser.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
