# Harish — a museum of things I have built

A portfolio you walk around in. It's a top-down pixel game: you play a small
hovering droid arriving at a museum, and the work is hung in four wings off a
central atrium.

| Wing | What's in it |
| --- | --- |
| North-west | Automations |
| North-east | Personal projects |
| South-west | Client work |
| South-east | About me |

Walk to the plinth in the middle of a wing, press <kbd>E</kbd>, and the exhibit
list opens.

---

## Adding your work

**Edit `src/data/projects.js`. That's the whole job.** The museum, the exhibit
menus and the plain-text list are all generated from that one file — nothing
else needs touching when the content changes.

Each entry looks like this. Only `title` and `tagline` are required; anything
you leave out simply doesn't render.

```js
{
  title:       'Invoice reconciler',
  year:        '2025',
  tagline:     'One line. What it is, in plain words.',
  description: 'A paragraph. What problem it solved, what you decided, '
             + 'what happened after.',
  tech:        ['Python', 'n8n', 'Postgres'],
  highlights:  ['Cut a 6-hour week to 20 minutes'],
  links:       [{ label: 'Repo', url: 'https://…' }],
}
```

A wing with no entries says so rather than breaking, and a wing with twelve
scrolls. Renaming a wing is the `title` field on that wing; the id (used by the
plinth) stays put.

---

## Running it

There is no build step and there are no dependencies. But the code uses ES
modules, which browsers refuse to load over `file://`, so it needs to be served
over HTTP:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Deploying is copying the directory somewhere. On GitHub Pages, point Pages at
the branch root and it works as-is.

---

## Controls

| | |
| --- | --- |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> | walk |
| <kbd>E</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd> | look at an exhibit |
| <kbd>Esc</kbd> | close whatever is open |

Any key skips the opening cinematic. It's skipped automatically on a return
visit — the flag lives in `localStorage` under `harish-museum-visited`.

---

## Who gets what

- **Desktop** gets the game, with a permanent *Skip to list* button in the
  corner for anyone who doesn't want to play. That same list is the accessible
  path through the content — real text, real links, real headings.
- **Phones** get the list only, plus a note that the full thing is on desktop.
  Walking a top-down character with a thumb is miserable, so it isn't offered.

---

## How it's put together

Vanilla JavaScript, one `<canvas>`, no framework and no dependencies.

```
index.html          markup + the overlays the game layers on top
styles.css          everything outside the canvas
src/
  config.js         constants and the palette — retheming starts here
  main.js           boot, scene machine, game loop
  map.js            the museum as room rectangles; collision; the baked background
  art.js            tile painters, props, and the droid's sprite grids
  player.js         the droid: movement, hover, facing
  font.js           a hand-drawn 5×7 bitmap font, for text inside the canvas
  intro.js          the arrival cinematic and title card
  menu.js           the exhibit menu (DOM)
  listview.js       the plain list (DOM), for the skip button and for mobile
  input.js          keyboard
  renderer.js       canvas sizing, integer pixel scale, camera
  data/projects.js  ← the content
```

A few decisions worth knowing about, if you come back to this later:

- **The map is rectangles, not a tile map.** `REGIONS` in `map.js` lists rooms
  and corridors; walls are generated around whatever is indoors. Moving a wing
  is a one-line change instead of retyping a grid.

- **The background is baked once.** Floors, walls and wall-mounted art render
  into an offscreen canvas at load, and each frame blits the visible slice of
  it. Freestanding props are drawn live and sorted by depth, so the droid
  passes behind plants and plinths correctly.

- **The pixel scale is always a whole number.** A fractional scale smears pixel
  art no matter how smoothing is set, so the renderer picks an integer scale
  for the window and then sizes the logical viewport to fill it. A bigger
  monitor sees more museum rather than the same museum blown up.

- **The menu is DOM, not canvas.** Bitmap text can't be selected, copied,
  linked, or read by a screen reader. So the chrome around the exhibit list is
  pixel-art in spirit while the content inside it is real text.

- **Single theme, deliberately.** The art has its palette baked into the
  sprites; a light mode would fight it rather than serve it.
