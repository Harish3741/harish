// A row of events across the top of an entry, and whichever one you pick shown
// underneath it.
//
// Some entries are not one thing with one write-up. A society runs events, and
// listing them as four separate projects would say the society was four
// societies; putting all four write-ups in one description would be a wall.
// So the entry keeps its own description, and the events sit below it as tabs.
//
// An entry declares them instead of `images`:
//
//   events: [{ name: 'Notion Workshop', description: '…', images: [ … ] }]
//
// Each event is a picture slot in its own right, so everything the strip does —
// captions, per-picture `ratio`, the dashed placeholder before the photos
// arrive — works inside one without any of it being repeated here.

import { hasPictures, buildGallery } from './picture.js';

export function hasEvents(entry) {
  return Array.isArray(entry.events) && entry.events.length > 0;
}

/**
 * @param cls   what the picker's own parts are called in this renderer
 * @param picCls what the picture slot is called, passed straight through
 */
export function buildEvents(entry, cls, picCls) {
  const wrap = document.createElement('div');
  wrap.className = cls.events;

  const tabs = document.createElement('div');
  tabs.className = cls.tabs;
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Events');

  const body = document.createElement('div');
  body.className = cls.panel;
  body.setAttribute('role', 'tabpanel');

  const buttons = entry.events.map((ev, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls.tab;
    b.textContent = ev.name;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => show(i));
    tabs.appendChild(b);
    return b;
  });

  function show(i) {
    buttons.forEach((b, n) => {
      const on = n === i;
      b.setAttribute('aria-selected', String(on));
      // only the selected tab is a tab stop; the arrows move between them
      b.tabIndex = on ? 0 : -1;
    });

    body.innerHTML = '';
    const ev = entry.events[i];
    if (ev.description) {
      for (const para of [].concat(ev.description)) {
        const p = document.createElement('p');
        p.className = cls.body;
        p.textContent = para;
        body.appendChild(p);
      }
    }
    if (hasPictures(ev)) body.appendChild(buildGallery(ev, picCls));
  }

  // Arrows walk the row when focus is in it, which is what a row of tabs is
  // expected to do — and the menu leaves them alone while focus is in here.
  tabs.addEventListener('keydown', (e) => {
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    if (!back && !fwd) return;
    e.preventDefault();
    e.stopPropagation();
    const at = buttons.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const to = (at + (fwd ? 1 : -1) + buttons.length) % buttons.length;
    show(to);
    buttons[to].focus();
  });

  wrap.append(tabs, body);
  show(0);
  return wrap;
}
