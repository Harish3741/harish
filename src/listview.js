// The plain-text version of the whole museum.
//
// Two jobs, one renderer:
//   1. Desktop — behind the "Skip to list" button, for anyone who doesn't want
//      to play, and as the accessible path through the same content.
//   2. Mobile — shown instead of the game, since walking a top-down character
//      with a thumb is nobody's idea of a good time.

import { SITE, WINGS } from './data/projects.js';

let listRoot, bodyEl, openBtn, closeBtn;
let isOpen = false;
let lastFocus = null;

export function initListView({ standalone = false } = {}) {
  listRoot = document.getElementById('listview');
  bodyEl = document.getElementById('list-body');
  openBtn = document.getElementById('skip-to-list');
  closeBtn = document.getElementById('list-close');

  render(standalone);

  if (standalone) {
    listRoot.hidden = false;
    listRoot.classList.add('is-open', 'is-standalone');
    isOpen = true;
    return;
  }

  openBtn.addEventListener('click', openList);
  closeBtn.addEventListener('click', closeList);
  listRoot.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeList();
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

function render(standalone) {
  bodyEl.innerHTML = '';

  const head = document.createElement('header');
  head.className = 'list-head';

  const h1 = document.createElement('h1');
  h1.textContent = SITE.name;
  head.appendChild(h1);

  const tag = document.createElement('p');
  tag.className = 'list-tagline';
  tag.textContent = SITE.tagline;
  head.appendChild(tag);

  if (standalone) {
    const note = document.createElement('p');
    note.className = 'list-note';
    note.textContent =
      'There is a version of this you can walk around in — a pixel museum with '
      + 'four wings. It needs a keyboard, so it lives on desktop. Everything in '
      + 'it is also below.';
    head.appendChild(note);
  }

  bodyEl.appendChild(head);

  WINGS.forEach((wing) => {
    const section = document.createElement('section');
    section.className = 'list-wing';
    section.id = `wing-${wing.id}`;

    const h2 = document.createElement('h2');
    h2.textContent = wing.title;
    section.appendChild(h2);

    if (wing.blurb) {
      const b = document.createElement('p');
      b.className = 'list-blurb';
      b.textContent = wing.blurb;
      section.appendChild(b);
    }

    (wing.projects || []).forEach((entry) => {
      section.appendChild(renderEntry(entry));
    });

    bodyEl.appendChild(section);
  });

  if (SITE.footer) {
    const foot = document.createElement('p');
    foot.className = 'list-footer';
    foot.textContent = SITE.footer;
    bodyEl.appendChild(foot);
  }
}

function renderEntry(entry) {
  const art = document.createElement('article');
  art.className = 'list-entry';

  const head = document.createElement('div');
  head.className = 'list-entry-head';

  const h3 = document.createElement('h3');
  h3.textContent = entry.title;
  head.appendChild(h3);

  if (entry.year) {
    const y = document.createElement('span');
    y.className = 'list-year';
    y.textContent = entry.year;
    head.appendChild(y);
  }
  art.appendChild(head);

  if (entry.tagline) {
    const t = document.createElement('p');
    t.className = 'list-entry-tagline';
    t.textContent = entry.tagline;
    art.appendChild(t);
  }

  if (entry.description) {
    const d = document.createElement('p');
    d.textContent = entry.description;
    art.appendChild(d);
  }

  if (entry.highlights && entry.highlights.length) {
    const ul = document.createElement('ul');
    entry.highlights.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    });
    art.appendChild(ul);
  }

  if (entry.tech && entry.tech.length) {
    const wrap = document.createElement('p');
    wrap.className = 'list-tech';
    entry.tech.forEach((tag) => {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = tag;
      wrap.appendChild(s);
    });
    art.appendChild(wrap);
  }

  if (entry.links && entry.links.length) {
    const wrap = document.createElement('p');
    wrap.className = 'list-links';
    entry.links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      wrap.appendChild(a);
    });
    art.appendChild(wrap);
  }

  return art;
}
