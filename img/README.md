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

## What photographs well

- **Landscape**, roughly 3:2 or 16:9. The slot is wider than it is tall.
- **Cropped tight** to the thing worth seeing. The panel is around 600px wide
  on a laptop, so a dense full-screen capture reads as grey mush.
- **PNG** for anything with text in it. JPEG smears small type.
- Blur anything with a real customer record, an email address or a token in it.
