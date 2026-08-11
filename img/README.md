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
```

There is no `atrium/`. The frames on the atrium walls are drawn, not loaded.

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
