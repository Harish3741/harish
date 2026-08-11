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
//   events: [{ name: 'Notion Workshop', date: '…', description: '…',
//              highlights: [ … ], images: [ … ] }]
//
// Each event is a picture slot in its own right, so everything the strip does —
// captions, per-picture `ratio`, the dashed placeholder before the photos
// arrive — works inside one without any of it being repeated here.

import { hasPictures, buildGallery } from './picture.js';
import { hasHighlights, buildHighlights } from './highlights.js';

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
    b.addEventListener('click', () => show(i, true));
    tabs.appendChild(b);
    return b;
  });

  // The nearest thing that actually scrolls. In the exhibit panel that is the
  // detail pane; in the plain list it is the sheet, or nothing at all.
  function scrollParent(node) {
    for (let n = node.parentElement; n; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
        return n;
      }
    }
    return null;
  }

  // Picking an event when the picker is below the fold looked like nothing had
  // happened: the tabs sat half-cut at the bottom edge, the panel did not move,
  // and the write-up you just asked for was off-screen. So bring it up — but
  // only when it isn't already all there, and never on first render, which
  // would yank the panel down the moment an entry opened.
  function reveal() {
    const pane = scrollParent(wrap);
    if (!pane) return;
    const box = wrap.getBoundingClientRect();
    const view = pane.getBoundingClientRect();
    if (box.top >= view.top && box.bottom <= view.bottom) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pane.scrollTo({
      top: pane.scrollTop + (box.top - view.top) - 8,
      behavior: still ? 'auto' : 'smooth',
    });
  }

  function show(i, bringIntoView) {
    buttons.forEach((b, n) => {
      const on = n === i;
      b.setAttribute('aria-selected', String(on));
      // only the selected tab is a tab stop; the arrows move between them
      b.tabIndex = on ? 0 : -1;
    });

    body.innerHTML = '';
    const ev = entry.events[i];

    // When it ran, above the write-up. The tabs are names only — four dates in
    // the row would make it a timetable and cost the names their room.
    if (ev.date) {
      const d = document.createElement('p');
      d.className = cls.date;
      d.textContent = ev.date;
      body.appendChild(d);
    }

    if (ev.description) {
      for (const para of [].concat(ev.description)) {
        const p = document.createElement('p');
        p.className = cls.body;
        p.textContent = para;
        body.appendChild(p);
      }
    }

    if (hasHighlights(ev)) body.appendChild(buildHighlights(ev, cls));
    if (hasPictures(ev)) body.appendChild(buildGallery(ev, picCls));

    if (bringIntoView) reveal();
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
    show(to, true);
    buttons[to].focus();
  });

  wrap.append(tabs, body);
  show(0);
  return wrap;
}
