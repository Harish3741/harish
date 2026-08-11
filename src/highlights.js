// The bullet list, and the small label that can name it.
//
// Three things render one: an entry in the exhibit panel, the same entry in the
// plain list, and now an event inside either of those. They were three copies
// of the same dozen lines, which is two too many for something that has to stay
// in step — the label is hidden from screen readers and handed to the list as
// its accessible name instead, and getting that wrong in one copy and not the
// others is exactly the sort of thing nobody notices.
//
// `cls` is what the two parts are called in whichever renderer is asking, so
// each one keeps its own look.

export function hasHighlights(src) {
  return Array.isArray(src.highlights) && src.highlights.length > 0;
}

export function buildHighlights(src, cls) {
  const frag = document.createDocumentFragment();
  const name = src.highlightsLabel;

  // Not a heading. The headings in these windows are entry titles, and a second
  // level of them over two bullet points is ceremony.
  if (name) {
    const lab = document.createElement('p');
    lab.className = cls.label;
    lab.textContent = name;
    lab.setAttribute('aria-hidden', 'true');   // the list below carries it
    frag.appendChild(lab);
  }

  const ul = document.createElement('ul');
  ul.className = cls.points;
  if (name) ul.setAttribute('aria-label', name);
  for (const line of src.highlights) {
    const li = document.createElement('li');
    li.textContent = line;
    ul.appendChild(li);
  }

  frag.appendChild(ul);
  return frag;
}
