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

import { SITE, WINGS, RESUME } from './data/projects.js';
import { hasPictures, buildGallery } from './picture.js';
import { hasEvents, buildEvents } from './eventpicker.js';

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
};

let listRoot, bodyEl, openBtn, closeBtn;
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

  const menu = el('div', 'mc-menu');
  WINGS.forEach((wing) => {
    const b = el('button', 'mc-btn');
    b.type = 'button';
    b.appendChild(el('span', 'mc-btn-label', wing.title));
    const n = (wing.projects || []).length;
    b.appendChild(el('span', 'mc-btn-sub', `${n} ${n === 1 ? 'entry' : 'entries'}`));
    b.addEventListener('click', () => renderWing(wing));
    menu.appendChild(b);
  });

  // The résumé hangs on the atrium wall, which means it is only reachable by
  // walking there. It is also the one thing a stranger is most likely to want,
  // so it gets its own button here rather than being playable-only.
  if (RESUME) {
    const b = el('button', 'mc-btn');
    b.type = 'button';
    b.appendChild(el('span', 'mc-btn-label', RESUME.title));
    b.appendChild(el('span', 'mc-btn-sub', RESUME.tagline || 'One page'));
    b.addEventListener('click', () => renderWing({
      title: RESUME.title, blurb: RESUME.tagline, projects: [RESUME],
    }));
    menu.appendChild(b);
  }

  bodyEl.appendChild(menu);

  if (standalone) {
    const note = el('p', 'mc-note',
      'There is a version of this you can walk around in — a pixel museum with '
      + 'four wings. It needs a keyboard, so it lives on desktop. Everything in '
      + 'it is also here.');
    bodyEl.appendChild(note);
  }

  if (SITE.footer) bodyEl.appendChild(el('p', 'mc-footer', SITE.footer));

  const first = menu.querySelector('.mc-btn');
  if (first && isOpen) first.focus();
}

/** Screen two: that wing's projects, as a list of worlds. */
function renderWing(wing) {
  bodyEl.dataset.screen = 'wing';
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
    // one string or several; several become paragraphs
    if (entry.description) {
      for (const para of [].concat(entry.description)) {
        text.appendChild(el('p', 'mc-world-desc', para));
      }
    }

    if (entry.highlights && entry.highlights.length) {
      const ul = el('ul', 'mc-world-points');
      entry.highlights.forEach((line) => ul.appendChild(el('li', null, line)));
      text.appendChild(ul);
    }

    // the same picture slot the exhibit panel shows, filled or waiting, and in
    // the same place: after the writing rather than in front of it
    if (hasEvents(entry)) {
      text.appendChild(buildEvents(entry, WORLD_EVENTS, WORLD_PICS));
    } else if (hasPictures(entry)) {
      text.appendChild(buildGallery(entry, WORLD_PICS));
    }

    if (entry.links && entry.links.length) {
      const wrap = el('p', 'mc-world-links');
      entry.links.forEach((link) => {
        const a = el('a', 'mc-btn mc-btn-small', link.label);
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        wrap.appendChild(a);
      });
      text.appendChild(wrap);
    }

    row.appendChild(text);
    list.appendChild(row);
  });

  bodyEl.appendChild(list);

  const back = el('button', 'mc-btn mc-back', 'Back');
  back.type = 'button';
  back.addEventListener('click', () => renderMenu(listRoot.classList.contains('is-standalone')));
  bodyEl.appendChild(back);
  back.focus();
}
