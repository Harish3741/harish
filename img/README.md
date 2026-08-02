# Pictures

Screenshots for the exhibits. One folder per wing, so a filename says which
room it belongs to without opening it.

```
img/
  client/       client work
  automations/  automations
  personal/     personal projects
  atrium/       the pictures on the atrium walls
```

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

**Resize it to 1200px wide.** The slot is 600px on a laptop, so 1200 covers a
retina screen and everything past that is dead weight — doubly so in the
single-file build, where a picture is carried as base64 and costs a third more
than it does on disk. A 2880px screenshot straight off a Mac is roughly ten
times the size it needs to be.

**Pick the format per picture, not once for all of them.**

- **JPEG** for photographs and for anything with a gradient behind it — a
  landing page, a hero. Quality 0.88 is indistinguishable here.
- **PNG** for flat UI with small text in it: forms, tables, dashboards. This is
  the one case where JPEG's smearing shows.

The three in `client/` came to 316 KB together this way, from 5.4 MB.

## What photographs well

- **Landscape**, roughly 3:2 or 16:9. The slot is wider than it is tall.
- **Cropped tight** to the thing worth seeing. A dense full-screen capture
  reads as grey mush at this size.
- Blur anything with a real customer record, an email address or a token in it.
