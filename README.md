# Harish — a museum of things I have built

A portfolio you walk around in. It's a top-down pixel game: you play a small
hovering droid arriving at a museum, and the work is hung in four wings off a
central atrium.

No two rooms are dressed the same way.

| Wing | What's in it | Dressed as |
| --- | --- | --- |
| North-west | Automations | a machine hall — a belt and three machines |
| North-east | Initiatives | a gallery — plinth, benches, statues |
| South-west | Projects | a boardroom — carpet tile, a table, three clients |
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
  launch:      'Mar 2025',           // when it went live; a bare year is fine
  tagline:     'One line. What it is, in plain words.',
  description: 'A paragraph. What problem it solved, what you decided, '
             + 'what happened after.',   // or an array, for two paragraphs
  tech:        ['Python', 'n8n', 'Postgres'],
  highlights:  ['Cut a 6-hour week to 20 minutes'],
  highlightsLabel: 'What came of it',   // names the list; not a heading
  outro:       'A closing line, under the pictures.',
  links:       [{ label: 'Repo', url: 'https://…' }],
  images:      [{ src: 'img/automations/dashboard.png',
                  caption: 'What it writes to, every morning at six.' }],
}
```

### Pictures

`images` takes as many as a project deserves. Several become a filmstrip you
swipe sideways — trackpad, touch, the arrows on the picture, the dots under it,
or the arrow keys once the strip has focus, which the strip handles itself
because the game takes the arrows off the window — one picture at a time, with
everything else about the entry stacked underneath. Stacked instead, the third
screenshot pushed the writing most of a panel down, and the writing is the part
people came to read. Captions are optional. For a single picture,
`image: 'img/…'` says the same thing more briefly and no strip furniture shows.

A caption is printed under the picture and doubles as its alt text. `alt`
instead describes the picture to a screen reader without printing anything —
which is what a photo wants when the wing it is in has no commentary under its
pictures. Neither, and the alt falls back to the entry's own name.

Pictures sit in a 3:2 frame and are letterboxed, never cropped — screenshots
arrive in every shape and cropping a UI loses the part that explains it. An
entry whose pictures are all a different shape says so with `ratio`:

```js
{ title: 'Job Scraper', ratio: '3 / 1', images: [ … ] }
```

An n8n canvas is about three times as wide as it is tall, and in a 3:2 frame it
still drew at its own shape with 200px of empty frame beneath it. The frame
never changes what size the picture renders at — only how much room is set
aside for it.

A single picture can overrule its entry, including with `ratio: 'auto'` for no
frame at all — full width at its own shape. That is what a tall picture wants
when it shares an entry with wide ones.

The strip is as tall as the picture you are looking at, not as tall as the
tallest one in it — otherwise a full-page screenshot in view two puts 700px of
empty space under the short one in view one, and pushes the writing that far
down.

Every picture in the whole museum is fetched and decoded at boot, not when a
panel opens. You walk to a room before you press E at anything in it, and that
walk is time the pictures can use, so a panel arrives finished rather than
assembling itself while you look at it.

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

### Entries that are several things

Some entries are not one thing with one write-up — a society is its events, and
listing four of them as four projects would say the society was four societies.
Such an entry declares `events` instead of `images`, and they appear as a row
you pick from, under the entry's own description:

```js
events: [
  { name: 'Notion Workshop', date: '19 March 2026', description: '…',
    highlightsLabel: 'What everyone built', highlights: [ … ], images: [ … ] },
  { name: 'Debugged', date: '6 June 2026', description: '…', images: [ … ],
    links: [{ label: 'Read the post', url: '…' }] },
  { name: 'Something upcoming', date: '5-6 September 2026',
    status: 'Event in progress', description: '…' },
]
```

An event takes most of what an entry takes: a date above the write-up, bullet
points under it, pictures below those, and `links` at the bottom. `status` is a brass tag beside the
date, for an event that hasn't finished — a future date on its own reads as a
typo by the time someone lands on it in October. The date lives in the panel rather
than on the tab — four dates in the row would make it a timetable and cost the
names their room.

Picking one moves nothing. The tab row is sticky, so it pins to the top of the
pane once you reach it and stays there while you read whatever is under it. An
earlier version scrolled the picker into view instead, which read as the panel
bouncing: events differ in length, a short one cannot scroll as far as a long
one, and every pick settled somewhere new. The event body also reserves just
enough room to keep where the reader already is a legal scroll position, so a
shorter event never shrinks the scrollable area out from under them — and no
more than that, or a two-bullet event sits above a screenful of nothing.

Each event is a picture slot in its own right, so captions, per-picture `ratio`
and the dashed placeholder all work inside one. The row is a proper tablist:
click, or arrow along it once it has focus — and while focus is in there the
arrows belong to the row rather than to the project list beside it.

### A wing with one thing in it

The left rail is for choosing between exhibits. A wing holding a single entry
has nothing to choose, so the rail collapses and the entry takes the whole
window. The entry's own title is dropped there too, because the window header
is already saying it.

The window itself stays the size every other wing gets — `is-single` hides the
rail, and a separate `is-document` is what lets a window shrink to fit its
contents. Only the résumé and the house rules take that: they are not wings,
and three lines of rules in a 660px frame is mostly empty frame. Everything you
reach from a plinth is the same rectangle, so the frame doesn't resize as you
move between rooms.

That rectangle's minimum width is set by the widest single row the panel has to
hold: five event tabs come to 664px, and the rail and padding take 320px of
whatever the window is.

`highlightsLabel` names the bullet list when "here are some facts" needs
saying out loud. It renders in the panel's small mono register — the one the
client line already uses — rather than as a heading: the headings in that
window are entry titles, and a second level of them over two bullet points is
ceremony. The list takes the label as its accessible name, so it is announced
once rather than twice.

`outro` is for the line that belongs *after* the pictures rather than before
them. A description paragraph renders above the highlights, which is too early
for a sign-off: "reach me here" three sections above the button it means leaves
the reader pointing at something they cannot see yet.

### Pictures off a camera

Resize before committing. A phone or a mirrorless shoots 4000-7000px, and the
single-file build inlines every picture as base64 at 1.33x its size — three
photos straight off a camera came to 17MB, which is most of an artifact's whole
budget spent on detail no one can see. The panel shows a picture at 780px at
most, so 1600px wide at JPEG quality 82 is twice what it can use:

```
python3 -c "
from PIL import Image, ImageOps
im = ImageOps.exif_transpose(Image.open('in.jpg'))
w, h = im.size
im.convert('RGB').resize((1600, round(h * 1600 / w)), Image.LANCZOS) \
  .save('img/personal/out.jpg', 'JPEG', quality=82, optimize=True, progressive=True)"
```

`exif_transpose` matters: a phone photo carries its rotation as metadata, and
resizing without honouring it lands the picture on its side.

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

The Projects wing is a boardroom, not a gallery: office carpet tile, two
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

`CLIENTS` used to carry `name`, `role` and `greeting` from when each figure was
its own conversation. Nothing read them, and they were still shipping their
placeholder text inside the published page, so they are gone.

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
# dist/index.html   one file, no requests to anything
```

It reports its own size, and pictures are most of it — the code is around
110 KB and every screenshot referenced is inlined as base64 on top of that, a
third larger than the file on disk. Which is the reason for resizing them
before they go in `img/`.

It concatenates the modules into one scope, so it refuses to build if two
modules declare the same top-level name.

---

## Controls

| | |
| --- | --- |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> | walk |
| <kbd>E</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd> | look at an exhibit, read a picture or the résumé, take a seat in the cinema |
| <kbd>Esc</kbd> or <kbd>E</kbd> | close whatever is open |

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
