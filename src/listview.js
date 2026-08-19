// The plain version of the whole museum, dressed as a Minecraft world select.
//
// Two jobs, one renderer:
//   1. Desktop — behind the "Skip to list" button, for anyone who doesn't want
//      to play, and as the accessible path through the same content.
//   2. Mobile — shown instead of the game, since walking a top-down character
//      with a thumb is nobody's idea of a good time.
//
// Two screens: the four wings as a menu, then that wing's projects as a list of
// "worlds". It's a joke, but it's also a genuinely good pattern for this — a
// title, a subtitle line of metadata, and one obvious button per row.

import { SITE, WINGS } from './data/projects.js';
import { hasPictures, buildGallery } from './picture.js';
import { hasEvents, buildEvents } from './eventpicker.js';
import { hasHighlights, buildHighlights } from './highlights.js';
import { hasLinks, buildLinks } from './links.js';

// what the shared picture slot calls itself out here
const WORLD_PICS = {
  gallery: 'mc-world-gallery',
  strip: 'mc-world-strip',
  track: 'mc-world-track',
  figure: 'mc-world-figure',
  slot: 'mc-world-slot',
  caption: 'mc-world-caption',
  nav: 'mc-gal-dots',
  arrow: 'mc-gal-arrow',
  dot: 'mc-gal-dot',
};

// and what the event picker calls itself
const WORLD_EVENTS = {
  events: 'mc-world-events',
  tabs: 'mc-world-tabs',
  tab: 'mc-world-tab',
  panel: 'mc-world-event',
  body: 'mc-world-desc',
  date: 'mc-world-date',
  status: 'mc-world-status',
  links: 'mc-world-links',
  link: 'mc-btn mc-btn-small',
  label: 'mc-world-label',
  points: 'mc-world-points',
};

const WORLD_POINTS = { label: 'mc-world-label', points: 'mc-world-points' };

/* On a phone the four wings are doors you tap rather than buttons you read.
   The art is the real room, captured from the game itself, so the plain version
   is looking at the same museum the desktop one walks around. `pos` is where to
   sit the crop, since each room keeps its interesting half somewhere different.
   `accent` is the room's own colour, brightened enough to read on dark. */
const ROOMS = {
  automations: { art: 'img/rooms/automations.jpg', accent: '#5E93A2', pos: '50% 34%' },
  personal:    { art: 'img/rooms/personal.jpg',    accent: '#C08A5A', pos: '50% 34%' },
  client:      { art: 'img/rooms/client.jpg',      accent: '#6D82BC', pos: '50% 62%' },
  about:       { art: 'img/rooms/about.jpg',       accent: '#C8535F', pos: '50% 55%' },
};

let listRoot, bodyEl, openBtn, closeBtn;

/* Both screens are drawn into the same scrollport, so a new one inherits
   wherever the last one was left. Reset it, and do it before focusing
   anything — focus() scrolls its target into view, which is how opening a
   wing used to land 1287px down: the Back button is the last thing on the
   screen, and focusing it dragged the whole sheet to the bottom. */
function toTop() {
  const sheet = listRoot && listRoot.querySelector('.sheet');
  if (sheet) sheet.scrollTop = 0;
}
let isOpen = false;
let lastFocus = null;
let dirtUrl = null;

export function initListView({ standalone = false } = {}) {
  listRoot = document.getElementById('listview');
  bodyEl = document.getElementById('list-body');
  openBtn = document.getElementById('skip-to-list');
  closeBtn = document.getElementById('list-close');

  dirtUrl = makeDirtTexture();
  listRoot.style.setProperty('--dirt', `url(${dirtUrl})`);

  renderMenu(standalone);

  if (standalone) {
    listRoot.hidden = false;
    listRoot.classList.add('is-open', 'is-standalone');
    isOpen = true;
    return;
  }

  openBtn.addEventListener('click', openList);
  closeBtn.addEventListener('click', closeList);
  listRoot.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.code === 'KeyE') {
      e.preventDefault();
      e.stopPropagation();
      // Escape backs out one screen at a time, then leaves
      if (bodyEl.dataset.screen === 'wing') renderMenu(listRoot.classList.contains('is-standalone'));
      else closeList();
    }
  });
}

export function isListOpen() {
  return isOpen;
}

export function openList() {
  if (isOpen) return;
  isOpen = true;
  lastFocus = document.activeElement;
  listRoot.hidden = false;
  requestAnimationFrame(() => listRoot.classList.add('is-open'));
  closeBtn.focus();
}

export function closeList() {
  if (!isOpen) return;
  isOpen = false;
  listRoot.classList.remove('is-open');
  setTimeout(() => { listRoot.hidden = true; }, 180);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ------------------------------------------------------------------ */

/**
 * The tiled dirt background, generated rather than shipped as an image so the
 * page still has no external requests. 16x16 of warm browns with a bit of
 * grit, scaled up with pixelated rendering.
 */
function makeDirtTexture() {
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 16;
  const c = cv.getContext('2d');
  const TONES = ['#6B4C2E', '#7A5734', '#5E4228', '#845E39', '#6F5030'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // deterministic, so the texture is identical every load
      const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      c.fillStyle = TONES[Math.floor(n * TONES.length)];
      c.fillRect(x, y, 1, 1);
    }
  }
  return cv.toDataURL();
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/** Screen one: the four wings, as a title-screen menu. */
function renderMenu(standalone) {
  bodyEl.dataset.screen = 'menu';
  bodyEl.innerHTML = '';

  const head = el('div', 'mc-head');
  head.appendChild(el('h1', 'mc-title', SITE.name));
  head.appendChild(el('p', 'mc-splash', SITE.tagline));
  bodyEl.appendChild(head);

  const menu = el('div', standalone ? 'mc-doors' : 'mc-menu');
  WINGS.forEach((wing) => {
    const n = (wing.projects || []).length;
    const count = `${n} ${n === 1 ? 'entry' : 'entries'}`;
    const room = ROOMS[wing.id];

    if (!standalone || !room) {
      const b = el('button', 'mc-btn');
      b.type = 'button';
      b.appendChild(el('span', 'mc-btn-label', wing.title));
      b.appendChild(el('span', 'mc-btn-sub', count));
      b.addEventListener('click', () => renderWing(wing));
      menu.appendChild(b);
      return;
    }

    const d = el('button', 'mc-door');
    d.type = 'button';
    d.style.setProperty('--room', room.accent);
    const art = el('span', 'mc-door-art');
    art.style.backgroundImage = `url(${room.art})`;
    art.style.backgroundPosition = room.pos;
    const cap = el('span', 'mc-door-cap');
    cap.appendChild(el('span', 'mc-door-name', wing.title));
    cap.appendChild(el('span', 'mc-door-sub', count));
    d.append(art, cap);
    d.addEventListener('click', () => enterRoom(wing, art));
    menu.appendChild(d);
  });

  // The résumé had a button of its own here, on the reasoning that it is the
  // one thing a stranger most wants and should not need walking to. It is gone
  // with the sheet off the atrium wall: an empty document is not worth a button
  // promising it, and offering it in two places while it says nothing is worse
  // than not offering it. RESUME still exists, so restoring this is the block
  // that was here.

  bodyEl.appendChild(menu);

  if (standalone) {
    const note = el('p', 'mc-note',
      'This list is the boring version. The real one is a game you walk around '
      + 'and explore all the things I\'ve built. It needs a keyboard so open '
      + 'this on a laptop and go have a look.');
    bodyEl.appendChild(note);
  }

  if (SITE.footer) bodyEl.appendChild(el('p', 'mc-footer', SITE.footer));

  toTop();
  const first = menu.querySelector('.mc-btn');
  if (first && isOpen) first.focus({ preventScroll: true });
}

/**
 * Tapping a door is how you enter a room on a phone. The art grows out of the
 * door to fill the screen and then hands over to the room's list, which is the
 * closest a list can get to the door-and-fade a game does when you walk inside.
 * Cosmetic only: the room renders whether or not the animation runs, and it is
 * skipped outright for anyone who has asked for less motion.
 */
function enterRoom(wing, art) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { renderWing(wing); return; }

  const from = art.getBoundingClientRect();
  const fly = document.createElement('div');
  fly.className = 'mc-fly';
  fly.style.backgroundImage = art.style.backgroundImage;
  fly.style.backgroundPosition = art.style.backgroundPosition;
  fly.style.left = `${from.left}px`;
  fly.style.top = `${from.top}px`;
  fly.style.width = `${from.width}px`;
  fly.style.height = `${from.height}px`;
  document.body.appendChild(fly);

  requestAnimationFrame(() => fly.classList.add('is-open'));
  // The room is drawn under the cover, so it is already there when it lifts.
  setTimeout(() => { renderWing(wing); fly.classList.add('is-gone'); }, 300);
  setTimeout(() => fly.remove(), 720);
}

/** Screen two: that wing's projects, as a list of worlds. */
function renderWing(wing) {
  const standalone = listRoot.classList.contains('is-standalone');
  const room = ROOMS[wing.id];
  bodyEl.dataset.screen = 'wing';
  bodyEl.dataset.room = room ? wing.id : '';
  if (room) bodyEl.style.setProperty('--room', room.accent);
  bodyEl.innerHTML = '';

  const head = el('div', 'mc-head');
  head.appendChild(el('h1', 'mc-title', wing.title));
  if (wing.blurb) head.appendChild(el('p', 'mc-splash', wing.blurb));
  bodyEl.appendChild(head);

  const list = el('div', 'mc-worlds');
  const entries = wing.projects || [];

  if (!entries.length) {
    list.appendChild(el('p', 'mc-empty', 'This wing is still being hung.'));
  }

  entries.forEach((entry) => {
    const row = el('article', 'mc-world');

    const icon = el('div', 'mc-world-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = (entry.title || '?').trim().charAt(0).toUpperCase();
    row.appendChild(icon);

    const text = el('div', 'mc-world-text');
    text.appendChild(el('h2', 'mc-world-name', entry.title));

    // the grey metadata line, the way a save file shows its date and mode
    const bits = [];
    if (entry.launch) bits.push(entry.launch);
    if (entry.client) bits.push(`for ${entry.client}`);
    if (entry.tech && entry.tech.length) bits.push(entry.tech.join(', '));
    if (bits.length) text.appendChild(el('p', 'mc-world-meta', bits.join('  ·  ')));

    if (entry.tagline) text.appendChild(el('p', 'mc-world-tagline', entry.tagline));

    // Everything past the tagline goes in one box so a phone can shut it.
    // Seven entries fully open is 6,610px of scrolling — nearly eight screens
    // to reach the last one. Closed, the same wing is one and a half, and you
    // can see what is in it before deciding what to read.
    const more = el('div', 'mc-world-more');
    text.appendChild(more);
    if (entry.description) {
      for (const para of [].concat(entry.description)) {
        more.appendChild(el('p', 'mc-world-desc', para));
      }
    }

    if (hasHighlights(entry)) more.appendChild(buildHighlights(entry, WORLD_POINTS));

    // the same picture slot the exhibit panel shows, filled or waiting, and in
    // the same place: after the writing rather than in front of it
    if (hasEvents(entry)) {
      more.appendChild(buildEvents(entry, WORLD_EVENTS, WORLD_PICS));
    } else if (hasPictures(entry)) {
      more.appendChild(buildGallery(entry, WORLD_PICS));
    }

    if (entry.outro) more.appendChild(el('p', 'mc-world-desc', entry.outro));

    if (hasLinks(entry)) more.appendChild(buildLinks(entry, WORLD_EVENTS));

    row.appendChild(text);

    // Only on a phone. On a desktop the list is the accessible path through the
    // museum and hiding half of it behind a tap would make it a worse one.
    if (standalone && more.childElementCount) {
      row.classList.add('is-shut');
      const toggle = el('button', 'mc-world-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `${entry.title} — more`);
      toggle.addEventListener('click', () => {
        const shut = row.classList.toggle('is-shut');
        toggle.setAttribute('aria-expanded', String(!shut));
      });
      row.appendChild(toggle);
    }

    list.appendChild(row);
  });

  bodyEl.appendChild(list);

  const back = el('button', 'mc-btn mc-back', 'Back');
  back.type = 'button';
  back.addEventListener('click', () => renderMenu(listRoot.classList.contains('is-standalone')));
  bodyEl.appendChild(back);

  // The wing's own heading takes focus, not Back. Landing on "Back" is a
  // strange first thing to be told you are on when you have just opened a
  // section, and it sits at the very bottom; the title says which wing you
  // are in and tabbing on from it walks the entries in reading order.
  toTop();
  const title = head.querySelector('.mc-title');
  if (title && isOpen) {
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
}
