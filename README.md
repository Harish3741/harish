# Harish — a museum of things I have built

A portfolio you walk around in. It's a top-down pixel game: you play a small
hovering droid arriving at a museum, and the work is hung in four wings off a
central atrium.

No two rooms are dressed the same way.

| Wing | What's in it | Dressed as |
| --- | --- | --- |
| North-west | Automations | a machine hall — a belt and three machines |
| North-east | Personal projects | a gallery — plinth, pictures, benches |
| South-west | Client work | a boardroom — carpet tile, a table, three clients |
| South-east | About me | a cinema — one screen, one chair |

You start in the middle of the atrium, standing on the compass. Walk to the
plinth in the middle of a wing, press <kbd>E</kbd>, and the exhibit list opens.
There is no way in or out — the museum is the whole world, and every wing is
about two seconds away.

The atrium itself holds two things to read: the résumé, on a sheet of paper
hung on the wall above the compass, and the house rules, lying open on a
lectern below it.

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
  images:      [{ src: 'img/automations/dashboard.png',
                  caption: 'What it writes to, every morning at six.' }],
}
```

### Pictures

`images` takes as many as a project deserves: the first gets the full width of
the panel — it is the one that says what the thing is — and the rest pair up
underneath it. Captions are optional. For a single picture, `image: 'img/…'`
says the same thing more briefly.

Files go in `img/<wing>/` and are referenced by path. **A path with no file
behind it draws the dashed *photo goes here* slot rather than a broken image**,
so a path can be committed before its picture is. `image: null` — the key with
nothing in it — asks for that same slot deliberately, which keeps the layout
from jumping about later. Leave both keys out and no slot shows at all.

The standalone build reads whatever is referenced and inlines it as a data URI,
so the same content file serves the hosted folder and the single file, and the
bundle still makes no requests to anything. See `img/README.md` for what
photographs well at this size.

A wing with no entries says so rather than breaking, and a wing with twelve
scrolls. Renaming a wing is the `title` field on that wing; the id (used by the
plinth) stays put.

### Pictures on the walls

The Personal Projects wing hangs four frames and the atrium four more.
`PAINTINGS` in the same file gives them captions, left to right along the wall.
Every frame can be walked up to and read whether or not it has an entry yet —
a `null` slot says so and points at this file, because a frame that swallows
the keypress teaches you not to bother pressing E at the next one.

```js
{ title: 'Invoice reconciler',
  caption: 'The dashboard it writes to, every morning at six.',
  image: 'img/atrium/dashboard.png' }
```

A picture on a wall is one picture, not a set — `image` only. These want a
caption rather than a write-up.

The atrium hangs four, two down each side wall — `PAINTINGS.atrium` runs west
top-to-bottom, then east. Its end wall carries the résumé instead. Only the
Personal Projects wing is still a gallery; the other three hang pipework,
downlights and nothing at all, so their `PAINTINGS` keys go unused.

### The résumé and the rules

`RESUME` and `RULES`, same file. Both take the same fields as a project entry,
so `highlights`, `tech` and `links` all work; anything you leave out doesn't
render. `links` on the résumé is where a PDF goes — a file next to the page, a
data URI, or a link to wherever it already lives.

```js
export const RESUME = {
  title: 'Harish — résumé',
  tagline: 'The short version, on one page.',
  description: '…',
  links: [{ label: 'Download PDF', url: 'resume.pdf' }],
};
```

### The machine hall

The Automations wing is a plant room: three machines along the back wall, a
conveyor running past their feet with crates on it, pipework overhead, a safety
line painted on the floor and drums stacked in the corners.

The three machines are wired to each other — press <kbd>E</kbd> at any of them
and the wing's whole list opens. They are one plant, not three exhibits, and
picking a flow off a list beats walking between cabinets to find it. Nothing to
configure: add entries to `WINGS → automations → projects` and they're in the
list.

### The boardroom

The Client Work wing is a boardroom, not a gallery: office carpet tile, two
downlights, a table standing end-on to the door and three clients round it —
one down each side, one at the far head.

**The table is what you press.** Get anywhere near it and the wing's list
opens. The three clients used to be three separate conversations, which meant
walking round the table to find a particular project; one list at the table is
quicker to read and quicker to leave. They are still who the room is about.

The two things are wired separately, and it's worth being clear which does
what. `client:` on a project is a plain string, and it is what renders — *For
Hannah* above the description, and `for Hannah` in the skip-to-list. `CLIENTS`
only dresses the three figures standing round the table: `hair` and `palette`,
nothing else. They are the room's furniture, not a lookup.

```js
// in WINGS → client → projects — this string is what shows
{ title: 'Nail Studio by H', client: 'Hannah', … }

export const CLIENTS = [
  { hair: 'short',                          // or 'long'
    palette: { K: '#2E2018', S: '#C98F63', T: '#3A5A78', P: '#2A2E38' } },
  // …two more
];
```

Three is what the room is built for — fewer leaves a place at the table
empty. They don't have to correspond to three real clients, and with the table
holding one list they no longer do.

`CLIENTS` still carries `name`, `role` and `greeting` from when each figure was
its own conversation. Nothing reads them now.

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
| <kbd>E</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd> | look at an exhibit, read a picture or the résumé, take a seat in the cinema |
| <kbd>Esc</kbd> | close whatever is open |

Leave the droid alone for nine seconds and it powers down; any key wakes it.

Any key skips the opening cinematic. It plays once per visit and is skipped
on a reload — the flag lives in `sessionStorage` under
`harish-museum-visited`, so closing the tab resets it. It was `localStorage`
at first, which meant the front door showed once per browser ever.

---

## Who gets what

- **Desktop** gets the game, with a permanent *Skip to list* button in the
  corner for anyone who doesn't want to play. The list is dressed as a
  Minecraft world picker: the four wings and the résumé as a menu, then each
  one's entries as a list of worlds. It is also the accessible path through the
  content — real text, real links, real headings, reachable by keyboard.
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
  picture.js        the picture slot both of those share
  input.js          keyboard
  renderer.js       canvas sizing, integer pixel scale, camera
  data/projects.js  ← the content
img/                screenshots, one folder per wing
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

- **A room's walls are themed to its floor.** `WALLS` in `config.js` holds a
  palette per theme and a region names one; a region without one gets the
  museum's own plaster. The plant room is painted blockwork over stone, the
  boardroom light commercial plaster over carpet tile, the cinema charcoal over
  charcoal. The inlaid margin where a floor meets a wall goes with them, off
  the floor's own name. The masonry outside a room stays the building's brown
  everywhere — the theming is what you see standing *in* a room, not what the
  building is made of.

- **The prompt bubble sits above whatever it names, never on it.** Each
  interactable declares the top of its own art — a picture's frame, a plinth's
  case, a machine's cabinet — and the bubble places itself clear of that. The
  hand-tuned lifts it replaced drifted out of true every time a prop was
  redrawn. Things with several access points onto one list, like the three
  machines, pin the bubble to one spot so walking the line doesn't make it hop.

- **Walls that run away from the camera get cheated perspective.** A top-down
  view only gives you a face to hang things on where a wall runs left to right;
  the atrium's side walls and the cinema's screen wall are seen from above and
  have none. So those are drawn turned on their side, standing a few pixels
  proud of the wall with the light down the edge that faces the room — the same
  licence every top-down game takes with doorways.

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
