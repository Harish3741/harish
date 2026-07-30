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

You start in the middle of the atrium. Walk to the plinth in the middle of a
wing, press <kbd>E</kbd>, and the exhibit list opens. There is no way in or out
— the museum is the whole world, and every wing is about two seconds away.

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

### Pictures on the walls

Each wing hangs four frames. `PAINTINGS` in the same file gives them captions,
left to right along the wall — an entry makes that frame something you can walk
up to and read, and leaving it `null` keeps the frame as decoration.

```js
{ title: 'Invoice reconciler',
  caption: 'The dashboard it writes to, every morning at six.',
  image: 'data:image/png;base64,…' }   // or 'img/dashboard.png'
```

`image` is optional and takes any URL a browser can load. A data URI keeps the
picture inside the file, which is what the standalone build needs.

### The screening room

The About Me wing is a small cinema rather than a gallery: black and red, a
screen on the west wall, one armchair facing it, and a character standing by
the door. `ABOUT` in the same file drives all of it.

- Press <kbd>E</kbd> at the character and they give you the About Me entries.
- Sit in the chair and the camera pans to the screen, which plays `ABOUT.video`.

```js
export const ABOUT = {
  name: 'Harish',
  video: 'media/intro.mp4',        // or a data URI, or null
  videoCaption: 'A short introduction.',
  palette: { K: '#241A16', S: '#B87A4E', T: '#8E2A32', /* … */ },
};
```

`video` being `null` is fine — the screen stays dark and says so. `palette`
recolours the character (hair, skin, shirt, trousers, shoes) without touching
the sprite.

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

For anywhere that wants a single file and no server — an email attachment, a
host that won't serve modules, a strict content policy — there is a bundler:

```sh
node tools/build-standalone.mjs
# dist/index.html   one file, ~105 KB, no requests to anything
```

It concatenates the modules into one scope, so it refuses to build if two
modules declare the same top-level name.

---

## Controls

| | |
| --- | --- |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> | walk |
| <kbd>E</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd> | look at an exhibit, read a picture, sit on a bench |
| <kbd>Esc</kbd> | close whatever is open |

Leave the droid alone for nine seconds and it powers down; any key wakes it.

Any key skips the opening cinematic. It's skipped automatically on a return
visit — the flag lives in `localStorage` under `harish-museum-visited`.

---

## Who gets what

- **Desktop** gets the game, with a permanent *Skip to list* button in the
  corner for anyone who doesn't want to play. The list is dressed as a
  Minecraft world picker: the four wings as a menu, then that wing's projects
  as a list of worlds. It is also the accessible path through the content —
  real text, real links, real headings, reachable by keyboard.
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
  and the arches between them; every floorless tile inside the building's
  footprint becomes masonry. Moving a wing is a one-line change instead of
  retyping a grid.

- **Every wing opens straight onto the atrium.** There are no connecting
  corridors, and no entrance hall or exterior either. The first version had all
  three and crossing the museum took fifteen seconds, which is fifteen seconds
  of holding an arrow key. Every wing is now about two.

- **Rooms and arches are an odd number of tiles across.** That puts both their
  centres on a tile rather than a tile boundary, which is what lets each arch
  line up exactly with the plinth behind it. Before they were aligned, a bench
  sat in one doorway and the droid could wedge itself on it.

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
