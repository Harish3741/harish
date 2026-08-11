// The row of buttons at the bottom of a thing: a repo, a live site, a post.
//
// Same reasoning as highlights.js. An entry renders these in the exhibit panel
// and again in the plain list, and now an event renders them too — three copies
// of the same ten lines, all of which have to remember `rel="noopener"`, which
// is exactly the sort of detail that goes missing from the third copy.
//
// `cls` names the wrapper and the anchor, so the panel's brass buttons and the
// list's stone ones stay as different as they look.

export function hasLinks(src) {
  return Array.isArray(src.links) && src.links.length > 0;
}

export function buildLinks(src, cls) {
  const wrap = document.createElement('div');
  wrap.className = cls.links;

  for (const link of src.links) {
    if (!link || !link.url) continue;
    const a = document.createElement('a');
    if (cls.link) a.className = cls.link;
    a.href = link.url;
    a.textContent = link.label;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    wrap.appendChild(a);
  }

  return wrap;
}
