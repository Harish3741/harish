// The picture slot, shared by the exhibit panel and the plain list.
//
// An entry declares pictures with `image` (one) or `images` (several). A real
// project usually has more than one shot worth showing — a landing page, the
// form behind it, the thing it produces — and one of them is never the whole
// story.
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
 * The whole slot as one element: every picture the entry has, or the dashed
 * placeholder if it has none. `cls` names the classes to use, so the two
 * renderers can look like themselves while behaving identically.
 */
export function buildGallery(entry, cls) {
  const wrap = document.createElement('div');
  const pics = pictureList(entry);

  wrap.className = cls.gallery;
  if (pics.length < 2) wrap.classList.add('is-one');

  if (!pics.length) {
    wrap.appendChild(emptyFigure(cls));
    return wrap;
  }

  for (const pic of pics) wrap.appendChild(pictureFigure(pic, entry, cls));
  return wrap;
}

/* ------------------------------------------------------------------ */

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

  const img = document.createElement('img');
  img.src = pic.src;
  img.alt = pic.caption || entry.title || '';
  img.loading = 'lazy';

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
