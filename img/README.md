# Pictures

Screenshots for the exhibits. One folder per wing, so a filename says which
room it belongs to without opening it.

The folder names are the wings' ids, which is why two of them read oddly: the
wings were renamed in the content file and the ids stayed put, because the ids
are what the plinths are wired to.

```
img/
  automations/  Automations
  personal/     Initiatives   (id: personal)
  client/       Projects      (id: client)
  rooms/        the rooms themselves — see below
```

There is no `atrium/`. The frames on the atrium walls are drawn, not loaded.

`rooms/` is not photographs of exhibits but of the four rooms, shown at the
head of a wing on a phone. Do not hand-edit them: they are rendered out of the
game itself by `node tools/rooms.mjs` (with the folder served, and Playwright
resolvable), which blits each room out of the same baked background the game
draws from and puts its props back on top. The droid is deliberately left out —
it is already standing in the atrium above these pictures. Re-run it after
anything that changes how a room looks, and it will produce the same four
files byte for byte until something does.

Referenced from `src/data/projects.js` by path, relative to the page:

```js
images: [
  { src: 'img/client/nail-studio-home.png', caption: 'The landing page.' },
]
```

A path that doesn't resolve draws the dashed *photo goes here* slot rather
than a broken image, so a path can be committed before its file is.

`node tools/build-standalone.mjs` inlines everything referenced here as data
URIs, so the single-file build carries its own pictures and makes no requests.
Anything in this folder that nothing references is left out of that build.

## Before a screenshot goes in here

**Resize it to 1600px wide.** The panel shows a picture at 780px at most, so
1600 covers a retina screen and everything past that is dead weight — doubly so
in the single-file build, where a picture is carried as base64 and costs a third
more than it does on disk. A photo straight off a camera is 4000-7000px: three
of them came to 17MB, which is most of an artifact's entire budget spent on
detail nobody can see.

```
python3 -c "
from PIL import Image, ImageOps
im = ImageOps.exif_transpose(Image.open('in.jpg'))
w, h = im.size
im.convert('RGB').resize((1600, round(h * 1600 / w)), Image.LANCZOS) \
  .save('img/personal/out.jpg', 'JPEG', quality=82, optimize=True, progressive=True)"
```

`exif_transpose` matters for anything off a phone: the rotation lives in
metadata, and resizing without honouring it lands the picture on its side.

**Pick the format per picture, not once for all of them.**

- **JPEG** for photographs and for anything with a gradient behind it — a
  landing page, a hero. Quality 0.88 is indistinguishable here.
- **PNG** for flat UI with small text in it: forms, tables, dashboards. This is
  the one case where JPEG's smearing shows.

The three in `client/` came to 316 KB together this way, from 5.4 MB. The three
event photos in `personal/` came to 524 KB, from 16.6 MB.

## What photographs well

- **Landscape**, roughly 3:2 or 16:9. The slot is wider than it is tall.
- **Cropped tight** to the thing worth seeing. A dense full-screen capture
  reads as grey mush at this size.
- Blur anything with a real customer record, an email address or a token in it.

## Phone screenshots

They are the wrong shape for the slot and there is no cropping your way out of
it — a 1170x2532 screen is 0.46 where the frame wants about 1.6. Dropped in
whole, one fills a third of the frame and the rest goes dark. Measured on the
tall Scorify writing shot, which is much squarer than a phone: 67%.

So they go in as **sheets**: several phones side by side at a matched height on
`#16100A`, the letterbox colour, so the margins disappear into the frame. Three
or four phones make a landscape sheet — 1.4 and 1.9 — which fills it. That is
what `client/forkit-home-to-match.jpg` is, and what
`automations/spending-tracker-sheet.png` was before it.

Prefer **one sheet per entry** over a strip of several. Four screens side by
side read as one run through the app; the same four as two sheets are something
to click through, and the reader has to hold the first half in their head. It
is also the only layout with no frame problem to solve.

If an entry does need more than one, build them all on **one canvas**, sized
from the group with the most phones in it, and centre the shorter groups.
Otherwise a three-up and a two-up are different shapes, the entry's single
`ratio` fits neither, and the frame changes height as you swipe — the thing the
fixed frame exists to stop. A two-up on a three-up canvas fills 66% of it and
the rest is dark, which is what letterboxing would have done anyway; doing it
in the file keeps it predictable.

JPEG, not PNG, despite the small text: at 100% the two are indistinguishable
here and the sheet is a quarter of the weight, and the frame shows it at a
third of 100% anyway. The ForkIt sheet is 266 KB; as PNG it was 1.1 MB.
