// The full-screen exhibit menu — the thing that opens when you press E at a
// plinth.
//
// This is DOM rather than canvas on purpose. Project titles, descriptions and
// links want to be selectable, copyable, linkable and readable by a screen
// reader; bitmap text on a canvas is none of those. So the *chrome* is pixel
// art (chunky stepped borders, brass rules) and the *content* is real text.

import { wingById } from './data/projects.js';

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

/** A framed picture off a wall. */
export function openArtwork(art, closedCallback) {
  openSingle({
    title: art.title,
    tagline: art.caption,
    image: art.image || null,
  }, 'On the wall', closedCallback);
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
  root.classList.remove('is-single');

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

/** What a client at the boardroom table hands you: { title, blurb, entries }. */
export function openPersonList(list, closedCallback) {
  openEntries(list.title, list.blurb, list.entries, closedCallback);
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

    if (entry.year) {
      const year = document.createElement('span');
      year.className = 'entry-year';
      year.textContent = entry.year;
      item.appendChild(year);
    }

    item.addEventListener('mouseenter', () => select(i));
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

  const h = document.createElement('h3');
  h.textContent = entry.title;
  detailEl.appendChild(h);

  if (entry.tagline) {
    const t = document.createElement('p');
    t.className = 'detail-tagline';
    t.textContent = entry.tagline;
    detailEl.appendChild(t);
  }

  const plate = document.createElement('div');
  plate.className = 'detail-plate';
  plate.setAttribute('aria-hidden', 'true');
  detailEl.appendChild(plate);

  // An entry that declares an `image` key gets a picture slot whether or not
  // there is a picture in it yet — an empty frame is a prompt to fill it, and
  // it keeps the layout from jumping about once the photos arrive.
  if ('image' in entry) {
    const fig = document.createElement('figure');
    fig.className = 'detail-figure';
    if (entry.image) {
      const img = document.createElement('img');
      img.src = entry.image;
      img.alt = entry.title;
      img.loading = 'lazy';
      fig.appendChild(img);
    } else {
      fig.classList.add('is-empty');
      const slot = document.createElement('div');
      slot.className = 'detail-slot';
      slot.textContent = 'Photo goes here';
      fig.appendChild(slot);
    }
    detailEl.appendChild(fig);
  }

  if (entry.description) {
    const d = document.createElement('p');
    d.className = 'detail-body';
    d.textContent = entry.description;
    detailEl.appendChild(d);
  }

  if (entry.highlights && entry.highlights.length) {
    const ul = document.createElement('ul');
    ul.className = 'detail-highlights';
    entry.highlights.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    });
    detailEl.appendChild(ul);
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

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    return;
  }

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
