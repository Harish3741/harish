// The picture slot, shared by the exhibit panel and the plain list.
//
// An entry declares pictures with `image` (one) or `images` (several). A real
// project usually has more than one shot worth showing — a landing page, the
// form behind it, the thing it produces — and one of them is never the whole
// story.
//
// Several pictures are a filmstrip you swipe sideways, one at a time, rather
// than a stack: stacked, the third screenshot pushed the description most of a
// panel further down, and the writing is the part people came to read. The
// strip keeps the pictures to one screenful and the words directly under them.
//
// Declaring the key and leaving it empty is meaningful: it draws a dashed slot
// saying a photo goes here. That keeps the layout from jumping about when the
// photos arrive, and reads as somewhere to put something rather than as an
// image that failed.
//
// Each picture is a path, or a `{ src, caption }` if it needs a line under it.
// Paths are relative to the page when the folder is served; the standalone
// build rewrites them to data URIs, so one content file works both ways.

/** Does this entry have a picture slot at all, filled or not? */
export function hasPictures(entry) {
  return 'image' in entry || 'images' in entry;
}

/** Whatever the content file said, as a list of `{ src, caption }`. */
export function pictureList(entry) {
  const raw = 'images' in entry ? entry.images : [entry.image];
  return (raw || [])
    .map((p) => (typeof p === 'string' ? { src: p, caption: '' } : p))
    .filter((p) => p && p.src);
}

/**
 * Fetch and decode every picture in these entries, so a panel is complete the
 * moment it opens instead of assembling itself while you look at it. Called
 * once at boot: you walk to a room before you press E at anything in it, and
 * that walk is time the pictures can use.
 */
export function preloadPictures(entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || !hasPictures(entry)) continue;
    for (const pic of pictureList(entry)) {
      if (seen.has(pic.src)) continue;
      seen.add(pic.src);
      const img = new Image();
      img.src = pic.src;
      if (img.decode) img.decode().catch(() => {});   // a missing file is fine
    }
  }
}

/**
 * The whole slot as one element: every picture the entry has as a swipeable
 * strip, or the dashed placeholder if it has none. `cls` names the classes to
 * use, so the two renderers can look like themselves while behaving the same.
 */
export function buildGallery(entry, cls) {
  const pics = pictureList(entry);
  const wrap = document.createElement('div');
  wrap.className = cls.gallery;

  // The frame defaults to 3:2 and an entry can say otherwise. A workflow canvas
  // is three times as wide as it is tall: in a 3:2 frame it still renders at
  // its own shape, with the rest of the frame left empty, so a wide entry
  // declares a wide frame and loses the dead space rather than the picture.
  if (entry.ratio) wrap.style.setProperty('--pic-ratio', entry.ratio);

  // The strip wraps the track so the arrows can sit on top of the pictures.
  // Below them they fall past the bottom of the panel on a laptop, and a
  // control you have to scroll to find is a control nobody knows is there.
  const strip = document.createElement('div');
  strip.className = cls.strip;
  const track = document.createElement('div');
  track.className = cls.track;
  strip.appendChild(track);
  wrap.appendChild(strip);

  if (!pics.length) {
    wrap.classList.add('is-one');
    track.appendChild(emptyFigure(cls));
    return wrap;
  }

  for (const pic of pics) track.appendChild(pictureFigure(pic, entry, cls));

  if (pics.length < 2) {
    wrap.classList.add('is-one');
    return wrap;
  }

  // Focusable so the strip can be scrolled from the keyboard; the menu leaves
  // the arrow keys alone while focus is in here.
  track.tabIndex = 0;
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', `${pics.length} pictures — scroll sideways`);
  addNav(wrap, strip, track, pics.length, cls);
  return wrap;
}

/* ------------------------------------------------------------------ */

/** Arrows over the strip, dots under it, both in step with the scroll. */
function addNav(wrap, strip, track, count, cls) {
  const prev = arrowButton('‹', 'Previous picture', cls, 'is-prev');
  const next = arrowButton('›', 'Next picture', cls, 'is-next');
  strip.append(prev, next);

  const nav = document.createElement('div');
  nav.className = cls.nav;
  const marks = [];
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = cls.dot;
    dot.setAttribute('aria-label', `Picture ${i + 1} of ${count}`);
    dot.addEventListener('click', () => scrollTo(track, i));
    nav.appendChild(dot);
    marks.push(dot);
  }
  wrap.appendChild(nav);

  const sync = () => {
    const i = current(track);
    marks.forEach((d, n) => d.setAttribute('aria-current', String(n === i)));
    prev.disabled = i <= 0;
    next.disabled = i >= count - 1;
    fitHeight(track, i);
  };

  prev.addEventListener('click', () => scrollTo(track, current(track) - 1));
  next.addEventListener('click', () => scrollTo(track, current(track) + 1));
  track.addEventListener('scroll', sync, { passive: true });
  // pictures arriving, and the window changing size, both change the fit
  track.addEventListener('load', () => sync(), true);
  window.addEventListener('resize', sync);
  sync();
}

/**
 * The strip is as tall as the picture you are looking at, not as tall as the
 * tallest one in it. Left to itself a flex row takes the tallest, which put
 * 700px of empty space under a short workflow shot because the next view along
 * was a full-page screenshot — and pushed the writing that far down with it.
 */
function fitHeight(track, i) {
  const slide = track.children[i];
  if (slide) track.style.height = `${slide.scrollHeight}px`;
}

function arrowButton(glyph, label, cls, where) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `${cls.arrow} ${where}`;
  b.textContent = glyph;
  b.setAttribute('aria-label', label);
  return b;
}

/** Which picture is showing. Each slide is exactly one track wide. */
function current(track) {
  const step = track.clientWidth;
  return step ? Math.round(track.scrollLeft / step) : 0;
}

function scrollTo(track, i) {
  track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
}

function emptyFigure(cls) {
  const fig = document.createElement('figure');
  fig.className = `${cls.figure} is-empty`;
  const slot = document.createElement('div');
  slot.className = cls.slot;
  slot.textContent = 'Photo goes here';
  fig.appendChild(slot);
  return fig;
}

function pictureFigure(pic, entry, cls) {
  const fig = document.createElement('figure');
  fig.className = cls.figure;

  // A picture can overrule the entry's frame. `auto` means no frame at all —
  // the picture takes the full width at its own shape, which is what a tall
  // one needs when its neighbours are wide.
  if (pic.ratio) fig.style.setProperty('--pic-ratio', pic.ratio);

  const img = document.createElement('img');
  img.src = pic.src;
  img.alt = pic.caption || entry.title || '';
  // Not lazy. These are preloaded at boot and there are a handful of them, so
  // deferring only bought a panel that filled itself in while you watched.
  img.decoding = 'sync';

  // A path can be committed before the file is. Rather than leaving a broken
  // image glyph in the panel, fall back to the same dashed slot an empty entry
  // gets — the picture is still on its way, which is what that slot means.
  img.addEventListener('error', () => {
    fig.replaceWith(emptyFigure(cls));
  });

  fig.appendChild(img);

  if (pic.caption) {
    const cap = document.createElement('figcaption');
    cap.className = cls.caption;
    cap.textContent = pic.caption;
    fig.appendChild(cap);
  }

  return fig;
}
