// The full-screen exhibit menu — the thing that opens when you press E at a
// plinth.
//
// This is DOM rather than canvas on purpose. Project titles, descriptions and
// links want to be selectable, copyable, linkable and readable by a screen
// reader; bitmap text on a canvas is none of those. So the *chrome* is pixel
// art (chunky stepped borders, brass rules) and the *content* is real text.

import { wingById } from './data/projects.js';
import { hasPictures, buildGallery } from './picture.js';
import { hasEvents, buildEvents } from './eventpicker.js';
import { hasHighlights, buildHighlights } from './highlights.js';

// what the shared picture slot calls itself in here
const DETAIL_PICS = {
  gallery: 'detail-gallery',
  strip: 'detail-strip',
  track: 'detail-track',
  figure: 'detail-figure',
  slot: 'detail-slot',
  caption: 'detail-caption',
  nav: 'gal-dots',
  arrow: 'gal-arrow',
  dot: 'gal-dot',
};

// and what the event picker calls itself
const DETAIL_EVENTS = {
  events: 'detail-events',
  tabs: 'detail-tabs',
  tab: 'detail-tab',
  panel: 'detail-event',
  body: 'detail-body',
  date: 'detail-date',
  status: 'detail-status',
  label: 'detail-label',
  points: 'detail-highlights',
};

const DETAIL_POINTS = { label: 'detail-label', points: 'detail-highlights' };

let root, listEl, detailEl, titleEl, blurbEl;
let entries = [];
let index = 0;
let open = false;
let onClose = null;

export function initMenu() {
  root = document.getElementById('menu');
  listEl = document.getElementById('menu-list');
  detailEl = document.getElementById('menu-detail');
  titleEl = document.getElementById('menu-wing');
  blurbEl = document.getElementById('menu-blurb');

  root.addEventListener('keydown', onKeydown);
  document.getElementById('menu-close').addEventListener('click', closeMenu);

  // clicking the dimmed area behind the window closes it too
  root.addEventListener('mousedown', (e) => {
    if (e.target === root) closeMenu();
  });
}

export function isMenuOpen() {
  return open;
}

/**
 * One thing, shown in the same window as the exhibit lists. It is a list of
 * one: the left rail would be a column with a single row in it, so it is hidden
 * and the detail pane gets the whole window.
 */
function openSingle(entry, blurb, closedCallback) {
  entries = [entry];
  index = 0;
  onClose = closedCallback || null;

  titleEl.textContent = entry.title;
  blurbEl.textContent = blurb;
  root.classList.add('is-single');

  renderList();
  renderDetail();

  open = true;
  root.hidden = false;
  requestAnimationFrame(() => root.classList.add('is-open'));
  listEl.focus();
}

/**
 * A document — the résumé off the atrium wall, or the rules off the lectern.
 * These arrive already in entry shape, so they pass straight through.
 */
export function openDocument(entry, blurb, closedCallback) {
  openSingle(entry, blurb || '', closedCallback);
}

/** A named list of entries: a wing's exhibits, or one client's projects. */
function openEntries(title, blurb, list, closedCallback) {
  entries = list || [];
  index = 0;
  onClose = closedCallback || null;

  titleEl.textContent = title;
  blurbEl.textContent = blurb || '';
  // A rail is for choosing between things. With one entry there is nothing to
  // choose, so it collapses to the same full-width panel a document gets.
  root.classList.toggle('is-single', entries.length === 1);

  renderList();
  renderDetail();

  open = true;
  root.hidden = false;
  // let the browser paint the element before starting the transition
  requestAnimationFrame(() => root.classList.add('is-open'));
  listEl.focus();
}

export function openMenu(wingId, closedCallback) {
  const wing = wingById(wingId);
  if (!wing) return;
  openEntries(wing.title, wing.blurb, wing.projects, closedCallback);
}

export function closeMenu() {
  if (!open) return;
  open = false;
  root.classList.remove('is-open');
  const done = () => { root.hidden = true; };
  setTimeout(done, 160);
  if (onClose) onClose();
}

/* ------------------------------------------------------------------ */

function renderList() {
  listEl.innerHTML = '';

  if (!entries.length) {
    const p = document.createElement('p');
    p.className = 'entry-empty';
    p.textContent = 'This wing is still being hung.';
    listEl.appendChild(p);
    return;
  }

  entries.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = 'entry';
    item.setAttribute('role', 'option');
    item.id = `entry-${i}`;
    item.setAttribute('aria-selected', String(i === index));

    const cursor = document.createElement('span');
    cursor.className = 'entry-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '▶';

    const label = document.createElement('span');
    label.className = 'entry-label';
    label.textContent = entry.title;

    item.append(cursor, label);

    if (entry.launch) {
      const launch = document.createElement('span');
      launch.className = 'entry-launch';
      launch.textContent = entry.launch;
      item.appendChild(launch);
    }

    // Click, not hover. Selecting on mouseenter meant the panel changed under
    // you on the way to somewhere else — crossing the rail to reach the close
    // button loaded every project on the way past.
    item.addEventListener('click', () => select(i));
    listEl.appendChild(item);
  });

  listEl.setAttribute('aria-activedescendant', `entry-${index}`);
}

function select(i) {
  if (i === index || i < 0 || i >= entries.length) return;
  index = i;
  [...listEl.querySelectorAll('.entry')].forEach((el, n) => {
    el.setAttribute('aria-selected', String(n === index));
  });
  listEl.setAttribute('aria-activedescendant', `entry-${index}`);
  renderDetail();
}

function renderDetail() {
  detailEl.innerHTML = '';
  const entry = entries[index];
  if (!entry) return;

  // A one-item window already carries the title in its header, so repeating it
  // here just says the same thing twice.
  if (!root.classList.contains('is-single')) {
    const h = document.createElement('h3');
    h.textContent = entry.title;
    detailEl.appendChild(h);
  }

  if (entry.tagline) {
    const t = document.createElement('p');
    t.className = 'detail-tagline';
    t.textContent = entry.tagline;
    detailEl.appendChild(t);
  }

  // the brass rule separates a heading from the body; with no heading above it
  // there is nothing for it to separate
  if (detailEl.childElementCount) {
    const plate = document.createElement('div');
    plate.className = 'detail-plate';
    plate.setAttribute('aria-hidden', 'true');
    detailEl.appendChild(plate);
  }

  if (entry.client) {
    const cl = document.createElement('p');
    cl.className = 'detail-client';
    cl.textContent = `For ${entry.client}`;
    detailEl.appendChild(cl);
  }

  // A description can be one string or several. Several become paragraphs —
  // a workflow that takes four sentences to describe wants a break in it.
  if (entry.description) {
    for (const para of [].concat(entry.description)) {
      const d = document.createElement('p');
      d.className = 'detail-body';
      d.textContent = para;
      detailEl.appendChild(d);
    }
  }

  if (hasHighlights(entry)) {
    detailEl.appendChild(buildHighlights(entry, DETAIL_POINTS));
  }

  // The pictures come after the writing. At the top they were the first thing
  // in the panel and pushed the description below the fold; what someone wants
  // first is what the thing is. An entry that declares `image` or `images` gets
  // the slot whether or not there is a picture in it yet — an empty frame is a
  // prompt to fill it, and it keeps the layout from moving once they arrive.
  // An entry with events shows those instead: the pictures live inside them.
  if (hasEvents(entry)) {
    detailEl.appendChild(buildEvents(entry, DETAIL_EVENTS, DETAIL_PICS));
  } else if (hasPictures(entry)) {
    detailEl.appendChild(buildGallery(entry, DETAIL_PICS));
  }

  if (entry.tech && entry.tech.length) {
    const wrap = document.createElement('div');
    wrap.className = 'detail-tech';
    entry.tech.forEach((tag) => {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = tag;
      wrap.appendChild(s);
    });
    detailEl.appendChild(wrap);
  }

  // A sign-off, after everything it is signing off from. `description` would
  // put it above the pictures, which is too early for "get in touch".
  if (entry.outro) {
    const o = document.createElement('p');
    o.className = 'detail-body detail-outro';
    o.textContent = entry.outro;
    detailEl.appendChild(o);
  }

  if (entry.links && entry.links.length) {
    const wrap = document.createElement('div');
    wrap.className = 'detail-links';
    entry.links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      wrap.appendChild(a);
    });
    detailEl.appendChild(wrap);
  }
}

function onKeydown(e) {
  if (!open) return;

  // Escape or E. E is what opened this, and reaching for it again to put it
  // down is what people try first.
  if (e.key === 'Escape' || e.code === 'KeyE') {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    return;
  }

  // Inside the picture strip the arrows belong to the strip — it is a scroll
  // container, and the browser already scrolls it a slide at a time.
  if (e.target.closest
      && e.target.closest('.detail-track, .detail-tabs')) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    e.stopPropagation();
    select(Math.min(entries.length - 1, index + 1));
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    e.stopPropagation();
    select(Math.max(0, index - 1));
  } else if (e.key === 'Home') {
    e.preventDefault();
    select(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    select(entries.length - 1);
  } else if (e.key === 'Enter') {
    // Enter follows the first link, if the exhibit has one
    const link = detailEl.querySelector('.detail-links a');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      link.click();
    }
  }
}
