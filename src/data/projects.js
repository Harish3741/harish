// ---------------------------------------------------------------------------
// THIS IS THE ONLY FILE YOU NEED TO EDIT TO PUT YOUR REAL WORK IN.
//
// Everything below is placeholder. Replace the entries, keep the shape.
// The game reads this at load: the museum, the menus and the plain-text
// fallback list are all generated from it, so nothing else needs touching.
//
// Per project, only `title` and `tagline` are required. Everything else is
// optional and simply won't render if you leave it out.
//
//   {
//     title:       'Invoice reconciler',
//     year:        '2025',
//     tagline:     'One line. What it is, in plain words.',
//     description: 'A paragraph. What problem it solved, what you decided, '
//                + 'what happened after.',
//     tech:        ['Python', 'n8n', 'Postgres'],
//     highlights:  ['Cut a 6-hour week to 20 minutes'],
//     links:       [{ label: 'Repo', url: 'https://…' }],
//   }
// ---------------------------------------------------------------------------

export const SITE = {
  name: 'HARISH',
  tagline: 'A museum of things I have built',
  footer: 'Built as a game because a list felt like a waste of a good idea.',
};

export const WINGS = [
  {
    id: 'automations',
    title: 'Automations',
    blurb: 'Things that now happen without me.',
    projects: [
      {
        title: 'Placeholder — automation one',
        year: '2025',
        tagline: 'Replace me with something that runs on a schedule.',
        description:
          'This is placeholder copy so the wing has something in it while the '
          + 'museum is being built. Swap it for a real automation: what was '
          + 'manual before, what triggers it now, and what it saves.',
        tech: ['Python', 'n8n'],
        highlights: ['Placeholder result, e.g. "6 hours a week back"'],
        links: [],
      },
      {
        title: 'Placeholder — automation two',
        year: '2024',
        tagline: 'A second slot, so the list has something to scroll.',
        description:
          'Same idea. Delete this entry entirely if you only have one — the '
          + 'menu adapts to however many are here.',
        tech: ['Apps Script'],
        links: [],
      },
    ],
  },

  {
    id: 'personal',
    title: 'Personal Projects',
    blurb: 'Built for me, for the pleasure of building them.',
    projects: [
      {
        title: 'Placeholder — personal one',
        year: '2025',
        tagline: 'The thing you made because you wanted it to exist.',
        description:
          'Placeholder. Good candidates for this wing: the side project that '
          + 'got away from you, the tool you use every day, the thing nobody '
          + 'asked for.',
        tech: ['JavaScript'],
        links: [],
      },
      {
        title: 'This museum',
        year: '2026',
        tagline: 'The site you are standing in.',
        description:
          'A third-person portfolio built on a canvas: a hand-drawn pixel '
          + 'museum with four wings, a hovering droid, and no framework '
          + 'anywhere. Vanilla JavaScript, no build step, no dependencies.',
        tech: ['JavaScript', 'Canvas', 'Pixel art'],
        highlights: ['Zero dependencies', 'Loads in under a second'],
        links: [],
      },
    ],
  },

  {
    id: 'client',
    title: 'Client Work',
    blurb: 'Built for other people, to a brief and a deadline.',
    projects: [
      {
        title: 'Placeholder — client one',
        year: '2025',
        tagline: 'What you were hired to solve.',
        description:
          'Placeholder. If any of this is under NDA, keep the entry and '
          + 'describe the shape of the problem without naming the client — '
          + '"a logistics company", "a mid-size retailer".',
        tech: ['React', 'Supabase'],
        links: [],
      },
    ],
  },

  {
    id: 'about',
    title: 'About Me',
    blurb: 'Who is running this place.',
    projects: [
      {
        title: 'Who I am',
        tagline: 'The short version.',
        description:
          'Placeholder. A few sentences: what you do, what you are drawn to, '
          + 'and what you are looking for next.',
        links: [],
      },
      {
        title: 'What I work with',
        tagline: 'Tools and languages I reach for.',
        description:
          'Placeholder. List the things you would be happy to be handed a '
          + 'problem in.',
        tech: ['Placeholder', 'Placeholder', 'Placeholder'],
        links: [],
      },
      {
        title: 'Get in touch',
        tagline: 'The fastest way to reach me.',
        description: 'Placeholder. Email, and wherever else you want to be found.',
        links: [],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// PICTURES ON THE WALLS
//
// Each wing hangs four framed pictures. Give an entry here and that frame
// becomes something you can walk up to and read; leave it out and the frame is
// simply decoration. Order is left to right along the wall.
//
// `image` takes any URL a browser can load — most usefully a data URI, so the
// picture travels with the file and needs no server:
//
//   image: 'data:image/png;base64,iVBORw0KGgo…'
//
// A plain path works too if you are hosting the folder: image: 'img/thing.png'.
// ---------------------------------------------------------------------------

export const PAINTINGS = {
  automations: [
    { title: 'Placeholder — picture one', caption: 'Swap this for a screenshot of something running. Anything with a chart in it looks good on a wall.' },
    { title: 'Placeholder — picture two', caption: 'A second frame. Delete the entry and the frame stays up, just without a plaque.' },
    null,
    { title: 'Placeholder — picture four', caption: 'Frames read left to right along the wall, so the order here is the order you walk past them.' },
  ],
  personal: [
    { title: 'Placeholder — picture one', caption: 'Personal work tends to photograph better than client work. Use the good screenshots here.' },
    null,
    { title: 'Placeholder — picture three', caption: 'Another slot.' },
    null,
  ],
  client: [
    { title: 'Placeholder — picture one', caption: 'If the work is under NDA, a cropped detail with no client name still reads as a picture.' },
    null, null, null,
  ],
  about: [
    { title: 'Placeholder — a photo of you', caption: 'The one wall in the building where a face belongs.' },
    null, null, null,
  ],
  // the atrium's own wall, above the entrance to the north wings
  atrium: [null, null, null, null],
};

// ---------------------------------------------------------------------------
// THE SCREENING ROOM
//
// The About Me wing is fitted out as a small cinema. Two things in it:
//
//   the person by the door  — press E and they give the summary below, which
//                             is just the About Me wing's entries above.
//   the chair               — sit in it and the camera pans to the screen and
//                             plays `video`.
//
// `video` takes any URL a browser can play: a file next to the page
// ('media/intro.mp4'), a data URI, or an absolute URL. Leave it null and the
// screen stays dark with a note instead — nothing breaks.
//
// `palette` is the character. Swap the hex values to change hair, skin and
// clothes; the sprite itself doesn't need touching.
// ---------------------------------------------------------------------------

export const ABOUT = {
  name: 'Harish',
  greeting: 'Oh — hello. Come in, sit down, the film is about to start.',
  video: null,
  videoPoster: null,
  videoCaption: 'A short introduction, recorded badly and with feeling.',
  palette: {
    '#': '#2A1B1C',   // outline
    K: '#241A16',     // hair
    S: '#B87A4E',     // skin
    E: '#160F0C',     // eyes
    T: '#8E2A32',     // shirt
    P: '#2E2A38',     // trousers
    O: '#1E1A18',     // shoes
  },
};

/** Look a wing up by the id used on its plinth. */
export function wingById(id) {
  return WINGS.find((w) => w.id === id) || null;
}
