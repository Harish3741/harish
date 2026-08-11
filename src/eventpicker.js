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
//   events: [{ name: 'Notion Workshop', date: '…', status: '…',
//              description: '…', highlights: [ … ], images: [ … ],
//              links: [ … ] }]
//
// Each event is a picture slot in its own right, so everything the strip does —
// captions, per-picture `ratio`, the dashed placeholder before the photos
// arrive — works inside one without any of it being repeated here.

import { hasPictures, buildGallery } from './picture.js';
import { hasHighlights, buildHighlights } from './highlights.js';
import { hasLinks, buildLinks } from './links.js';

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

  // Nothing here scrolls the pane. An earlier version brought the picker up
  // when it was below the fold, which fixed one thing and broke a worse one:
  // a short event cannot scroll as far as a long one, so the pane clamped and
  // every pick settled somewhere new — the panel appeared to bounce. The tab
  // row is sticky in the stylesheet instead, so it stays put once you reach it
  // and picking an event moves nothing at all.

  function show(i) {
    buttons.forEach((b, n) => {
      const on = n === i;
      b.setAttribute('aria-selected', String(on));
      // only the selected tab is a tab stop; the arrows move between them
      b.tabIndex = on ? 0 : -1;
    });

    // Nothing above the tab row changes when you pick an event, so the reader
    // should not move at all. Remember where they are before the body under
    // the tabs changes height — once it is empty the browser has already
    // clamped the scroll, and reading it then just locks the clamp in.
    const pane = scrollParent(wrap);
    const wanted = pane ? pane.scrollTop : 0;

    body.style.minHeight = '';
    body.innerHTML = '';
    const ev = entry.events[i];

    // When it ran, above the write-up. The tabs are names only — four dates in
    // the row would make it a timetable and cost the names their room.
    if (ev.date || ev.status) {
      const d = document.createElement('p');
      d.className = cls.date;
      // The trailing space is not decoration: the tag is a separate element with
      // a margin, so on screen the two are clearly apart — but read aloud they
      // ran together as "September 2026Event in progress".
      if (ev.date) d.append(ev.status ? `${ev.date} ` : ev.date);
      // An event still running says so beside its date. A future date on its
      // own reads as a typo by the time someone lands on it in October.
      if (ev.status) {
        const tag = document.createElement('span');
        tag.className = cls.status;
        tag.textContent = ev.status;
        d.appendChild(tag);
      }
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
    if (hasLinks(ev)) body.appendChild(buildLinks(ev, cls));

    if (!pane) return;

    // Events differ in length, and that was the last thing still moving the
    // panel: picking a shorter one shrinks what there is to scroll, so the
    // browser clamps the scroll and the tab row slides up even though nothing
    // above it changed. Reserve just enough room under the tabs to keep where
    // the reader already was a legal place to be — and not a pixel more.
    // Holding the tallest event's height would do the same job and leave a
    // short event sitting above a screenful of nothing.
    //
    // bodyTop is an offset inside the scrolling content, so it does not care
    // where the pane is scrolled to at the moment it is measured.
    const bodyTop = pane.scrollTop
      + (body.getBoundingClientRect().top - pane.getBoundingClientRect().top);
    const need = wanted + pane.clientHeight - bodyTop;
    if (need > 0) body.style.minHeight = `${need}px`;

    pane.scrollTop = wanted;
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
