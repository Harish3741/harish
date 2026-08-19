// The museum as the printed guide they hand you at the door.
//
// Two jobs, one renderer:
//   1. Desktop — behind the "Skip to list" button, for anyone who doesn't want
//      to play, and as the accessible path through the same content. It gets
//      both screens: the four wings as a contents page, then a wing.
//   2. Phone — what you get when you tap an arch in the atrium. There is no
//      menu screen there, because the atrium is the menu: the phone opens
//      straight into one wing and its Back button walks you out again.
//
// It used to be dressed as a Minecraft world select — dirt tiling, bevelled
// stone buttons, a splash line. The joke was good and the *type* was better:
// chunky monospace with a hard offset shadow, which is what pixels look like
// when they are letters. What it was not was a museum. So the dirt went and the
// type stayed. There are no cards here either: an index numeral in the gutter,
// a ruled spine beside it, a dotted leader from each name to its date, and a
// rule between one entry and the next — a contents page, which is a thing a
// museum actually hands out. Wing titles and index numerals are cut on canvas
// with the game's own 5x7 font, the same one the banners over the doorways are
// set in, so the list and the building read as one place.

import { SITE, WINGS } from './data/projects.js';
import { hasPictures, buildGallery } from './picture.js';
import { hasEvents, buildEvents } from './eventpicker.js';
import { hasHighlights, buildHighlights } from './highlights.js';
import { hasLinks, buildLinks } from './links.js';
import { engrave } from './plate.js';

// what the shared picture slot calls itself out here
const STRIP = {
  gallery: 'strip',
  strip: 'strip-frame',
  track: 'strip-track',
  figure: 'strip-figure',
  slot: 'strip-slot',
  caption: 'strip-caption',
  nav: 'strip-dots',
  arrow: 'strip-arrow',
  dot: 'strip-dot',
};

// and what the event picker calls itself
const EVENTS = {
  events: 'events',
  tabs: 'events-tabs',
  tab: 'events-tab',
  panel: 'event',
  body: 'exhibit-desc',
  date: 'exhibit-date',
  status: 'exhibit-status',
  links: 'exhibit-links',
  link: 'btn btn-link',
  label: 'exhibit-label',
  points: 'exhibit-points',
};

const POINTS = { label: 'exhibit-label', points: 'exhibit-points' };

/* Each wing's own colour, brightened enough to read on dark, and the capture of
   the real room the phone shows at the head of the list — the same room you
   were just looking at through the arch. `pos` is where to sit the crop, since
   each room keeps its interesting half somewhere different. */
const ROOMS = {
  automations: { art: 'img/rooms/automations.jpg', accent: '#5E93A2', pos: '50% 40%' },
  personal: { art: 'img/rooms/personal.jpg', accent: '#C08A5A', pos: '50% 42%' },
  client: { art: 'img/rooms/client.jpg', accent: '#6D82BC', pos: '50% 58%' },
  about: { art: 'img/rooms/about.jpg', accent: '#C8535F', pos: '50% 52%' },
};

let listRoot;
let bodyEl;
let openBtn;
let closeBtn;

let isOpen = false;
let lastFocus = null;
let exitToLobby = null;
let heading = null;      // the canvas heading to re-cut when the width changes
let refitting = 0;

/* Both screens are drawn into the same scrollport, so a new one inherits
   wherever the last one was left. Reset it, and do it before focusing
   anything — focus() scrolls its target into view, which is how opening a
   wing used to land 1287px down: the Back button is the last thing on the
   screen, and focusing it dragged the whole sheet to the bottom. */
function toTop() {
  const sheet = listRoot && listRoot.querySelector('.sheet');
  if (sheet) sheet.scrollTop = 0;
}

export function initListView({ standalone = false, onExit = null } = {}) {
  listRoot = document.getElementById('listview');
  bodyEl = document.getElementById('list-body');
  openBtn = document.getElementById('skip-to-list');
  closeBtn = document.getElementById('list-close');
  exitToLobby = onExit;

  window.addEventListener('resize', queueRefit);

  if (standalone) {
    // The atrium is the menu on a phone, so there is no menu screen to draw
    // here and nothing to show until a doorway is tapped.
    listRoot.classList.add('is-standalone');
    // The way out has to stay in reach. A wing with everything opened is
    // several screens long, and the Back button at the foot of it is a scroll
    // nobody should have to make to leave a room.
    closeBtn.textContent = '← Back to the atrium';
    closeBtn.addEventListener('click', () => { if (exitToLobby) exitToLobby(); });
    return;
  }

  renderMenu();
  openBtn.addEventListener('click', openList);
  closeBtn.addEventListener('click', closeList);
  listRoot.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.code === 'KeyE') {
      e.preventDefault();
      e.stopPropagation();
      // Escape backs out one screen at a time, then leaves
      if (bodyEl.dataset.screen === 'wing') renderMenu();
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
  requestAnimationFrame(() => {
    listRoot.classList.add('is-open');
    refit();
  });
  closeBtn.focus();
}

/** The phone's way in: straight to one wing, no menu on the way. */
export function openWing(id) {
  const wing = WINGS.find((w) => w.id === id);
  if (!wing) return;
  isOpen = true;
  listRoot.hidden = false;
  listRoot.classList.add('is-open');
  renderWing(wing);
  refit();
}

export function closeList() {
  if (!isOpen) return;
  isOpen = false;
  listRoot.classList.remove('is-open');
  const wasStandalone = listRoot.classList.contains('is-standalone');
  setTimeout(() => { listRoot.hidden = true; }, wasStandalone ? 0 : 180);
  if (!wasStandalone && lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ------------------------------------------------------------------ */

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function count(n) {
  return `${String(n).padStart(2, '0')} ${n === 1 ? 'exhibit' : 'exhibits'}`;
}

/** Re-cut the engraved heading for whatever width it has now. */
function refit() {
  if (!heading || !heading.cv.isConnected) return;
  engrave(heading.cv, heading.text, heading.opts);
}

function queueRefit() {
  cancelAnimationFrame(refitting);
  refitting = requestAnimationFrame(refit);
}

/**
 * The plate at the head of a screen: the title cut in the game's own pixels,
 * with the words themselves on a hidden element for anything that reads rather
 * than looks. Everything below a heading is real text — a paragraph set in a
 * 5x7 font is a paragraph nobody reads.
 */
function plate(title, sub, tally, room, strap) {
  const wrap = el('div', 'plate');

  // On a phone you have just walked through the arch, so the room you are
  // standing in is the top of its own plate.
  if (room) {
    const shot = el('div', 'plate-room');
    shot.setAttribute('aria-hidden', 'true');
    shot.style.backgroundImage = `url(${room.art})`;
    shot.style.backgroundPosition = room.pos;
    wrap.appendChild(shot);
  }

  // The masthead of a printed guide: whose building this is, then which part
  // of it you are holding.
  if (strap) {
    const line = el('p', 'plate-strap');
    line.appendChild(el('span', 'plate-who', SITE.name));
    line.appendChild(el('span', 'leader'));
    line.appendChild(el('span', 'plate-what', strap));
    wrap.appendChild(line);
  }

  const head = el('h1', 'plate-title');

  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  head.appendChild(cv);
  head.appendChild(el('span', 'sr-only', title));
  wrap.appendChild(head);

  // Printed slightly off-register, the museum's velvet a hair below the paper.
  // It is the one thing a two-colour press does that a screen never does by
  // accident, and it costs one extra pass of the same glyphs.
  heading = {
    cv,
    text: title,
    opts: { cap: 44, color: '#F3E8D6', shadow: '#9C4038' },
  };

  if (sub) wrap.appendChild(el('p', 'plate-sub', sub));

  if (tally) {
    const line = el('p', 'plate-count');
    line.appendChild(el('span', null, 'Contents'));
    line.appendChild(el('span', 'leader'));
    line.appendChild(el('span', null, tally));
    wrap.appendChild(line);
  }
  return wrap;
}

/** Screen one, desktop only: the four wings. */
function renderMenu() {
  bodyEl.dataset.screen = 'menu';
  bodyEl.innerHTML = '';

  bodyEl.appendChild(plate(SITE.name, SITE.tagline, '', null, null));

  const menu = el('nav', 'wings');
  menu.setAttribute('aria-label', 'The four wings');
  WINGS.forEach((wing) => {
    const room = ROOMS[wing.id];
    const b = el('button', 'wing');
    b.type = 'button';
    if (room) b.style.setProperty('--room', room.accent);
    b.appendChild(el('span', 'wing-name', wing.title));
    b.appendChild(el('span', 'leader'));
    b.appendChild(el('span', 'wing-count', count((wing.projects || []).length)));
    b.addEventListener('click', () => renderWing(wing));
    menu.appendChild(b);
  });

  // The résumé had a button of its own here, on the reasoning that it is the
  // one thing a stranger most wants and should not need walking to. It is gone
  // with the sheet off the atrium wall: an empty document is not worth a button
  // promising it, and offering it in two places while it says nothing is worse
  // than not offering it. RESUME still exists, so restoring this is the block
  // that was here.

  bodyEl.appendChild(menu);

  if (SITE.footer) bodyEl.appendChild(el('p', 'sheet-foot', SITE.footer));

  toTop();
  refit();
  const first = menu.querySelector('.wing');
  if (first && isOpen) first.focus({ preventScroll: true });
}

/** Screen two: one wing's exhibits, numbered. */
function renderWing(wing) {
  const standalone = listRoot.classList.contains('is-standalone');
  const room = ROOMS[wing.id];
  const entries = wing.projects || [];

  bodyEl.dataset.screen = 'wing';
  bodyEl.style.setProperty('--room', room ? room.accent : '');
  bodyEl.innerHTML = '';

  const at = WINGS.indexOf(wing) + 1;
  bodyEl.appendChild(plate(
    wing.title,
    wing.blurb,
    count(entries.length),
    standalone ? room : null,
    `Wing ${String(at).padStart(2, '0')} of ${String(WINGS.length).padStart(2, '0')}`
  ));

  const list = el('ol', 'exhibits');

  if (!entries.length) {
    bodyEl.appendChild(el('p', 'sheet-empty', 'This wing is still being hung.'));
  }

  entries.forEach((entry, i) => {
    list.appendChild(listing(entry, i, standalone));
  });

  bodyEl.appendChild(list);

  const back = el('button', 'btn btn-back',
    standalone ? 'Back to the atrium' : 'Back');
  back.type = 'button';
  back.addEventListener('click', () => {
    if (standalone && exitToLobby) exitToLobby();
    else renderMenu();
  });
  bodyEl.appendChild(back);

  // The wing's own heading takes focus, not Back. Landing on "Back" is a
  // strange first thing to be told you are on when you have just opened a
  // section, and it sits at the very bottom; the title says which wing you
  // are in and tabbing on from it walks the entries in reading order.
  toTop();
  refit();
  const title = bodyEl.querySelector('.plate-title');
  if (title && isOpen) {
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
}

/** One exhibit, as the guide lists it: index number, name, leader, date. */
function listing(entry, i, standalone) {
  const row = el('li', 'exhibit');
  const no = String(i + 1).padStart(2, '0');

  // The index numeral is cut in the game's font rather than set in the page's.
  // It is the one number in the guide you read as a landmark rather than as a
  // word, and the list is ordered markup, so nothing has to be said about it.
  const stamp = el('p', 'exhibit-no');
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  engrave(cv, no, { width: 46, cap: 27, color: '#8C765A', shadow: '#0E0906' });
  stamp.appendChild(cv);
  row.appendChild(stamp);

  // The head is its own box because the button that opens the entry is laid
  // over it. Laid over the whole entry — which is what it used to be — it
  // also covers the links and the picture arrows inside an open one, and a
  // button on top of a link is a link nobody can press.
  const head = el('div', 'exhibit-head');

  // The contents line: name, a dotted leader, and the date it went out. The
  // leader runs to the edge when there is no date, which is what a leader in a
  // printed contents page does anyway.
  const line = el('h2', 'exhibit-line');
  line.appendChild(el('span', 'exhibit-name', entry.title));
  line.appendChild(el('span', 'leader'));
  if (entry.launch) line.appendChild(el('span', 'exhibit-when', entry.launch));
  head.appendChild(line);

  if (entry.tagline) head.appendChild(el('p', 'exhibit-tag', entry.tagline));

  // for whom, and what out of — the small print under a label
  const bits = [];
  if (entry.client) bits.push(`for ${entry.client}`);
  if (entry.tech && entry.tech.length) bits.push(...entry.tech);
  if (bits.length) head.appendChild(el('p', 'exhibit-meta', bits.join('  ·  ')));

  row.appendChild(head);

  // Everything past the tagline goes in one box so a phone can shut it.
  // Seven entries fully open is 6,610px of scrolling — nearly eight screens
  // to reach the last one. Closed, the same wing is one and a half, and you
  // can see what is in it before deciding what to read.
  const more = el('div', 'exhibit-more');
  row.appendChild(more);

  if (entry.description) {
    for (const para of [].concat(entry.description)) {
      more.appendChild(el('p', 'exhibit-desc', para));
    }
  }

  if (hasHighlights(entry)) more.appendChild(buildHighlights(entry, POINTS));

  // the same picture slot the exhibit panel shows, filled or waiting
  if (hasEvents(entry)) more.appendChild(buildEvents(entry, EVENTS, STRIP));
  else if (hasPictures(entry)) more.appendChild(buildGallery(entry, STRIP));

  if (entry.outro) more.appendChild(el('p', 'exhibit-desc', entry.outro));

  if (hasLinks(entry)) more.appendChild(buildLinks(entry, EVENTS));

  const filled = more.childElementCount > 0;
  if (!filled) more.remove();

  // Only on a phone. On a desktop the list is the accessible path through the
  // museum and hiding half of it behind a tap would make it a worse one.
  if (standalone && filled) {
    row.classList.add('is-shut');
    const toggle = el('button', 'exhibit-open');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `${entry.title} — more`);
    toggle.addEventListener('click', () => {
      const shut = row.classList.toggle('is-shut');
      toggle.setAttribute('aria-expanded', String(!shut));
    });
    head.appendChild(toggle);
  }

  return row;
}
