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
//     launch:      'Mar 2025',   // when it went live. A bare year is fine too
//     tagline:     'One line. What it is, in plain words.',
//     description: 'A paragraph. What problem it solved, what you decided, '
//                + 'what happened after.',
//     tech:        ['Python', 'n8n', 'Postgres'],
//     highlights:  ['Cut a 6-hour week to 20 minutes'],
//     links:       [{ label: 'Repo', url: 'https://…' }],
//     images:      [{ src: 'img/…', caption: 'What you are looking at.' }],
//   }
//
// PICTURES. `images` takes as many as you like: the first gets the full width
// of the panel and the rest pair up under it. A caption is optional. One
// picture and `image: 'img/…'` says the same thing more briefly.
//
// Put the files in img/<wing>/ and reference them by path. A path with no file
// behind it draws a dashed "photo goes here" slot rather than a broken image,
// so you can commit the path now and the picture later. `image: null` — the
// key with nothing in it — draws that same slot deliberately.
//
// The standalone build inlines whatever is referenced as data URIs, so one
// content file serves both the hosted folder and the single-file version.
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
        image: null,
        launch: '2025',
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
        image: null,
        launch: '2024',
        tagline: 'A second slot, so the list has something to scroll.',
        description:
          'Same idea. Delete this entry entirely if you only have one — the '
          + 'menu adapts to however many are here.',
        tech: ['Apps Script'],
        links: [],
      },
      {
        title: 'Placeholder — automation three',
        image: null,
        launch: '2024',
        tagline: 'The machine hall has five bays.',
        description:
          'Five machines stand in that room and all five can be pressed. An '
          + 'entry here lights one of them up; a bay with no entry behind it '
          + 'stands there with its lamps out and says so when you inspect it.',
        tech: ['n8n'],
        links: [],
      },
      {
        title: 'Placeholder — automation four',
        image: null,
        launch: '2023',
        tagline: 'Fourth bay.',
        description: 'Replace or delete. Nothing breaks either way.',
        tech: ['n8n', 'Postgres'],
        links: [],
      },
      {
        title: 'Placeholder — automation five',
        image: null,
        launch: '2023',
        tagline: 'Fifth and last bay.',
        description:
          'A sixth entry would still show in the skip-to-list; the room only '
          + 'has five places to stand a machine.',
        tech: ['Zapier'],
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
        image: null,
        launch: '2025',
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
        image: null,
        launch: '2026',
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
        title: 'Scorify — NSW Selective Test Prep',
        launch: 'Feb 2026',
        images: [],
        tagline: 'Subscription practice platform for the NSW Selective High '
          + 'School Placement Test.',
        description:
          'Year 5 and 6 students preparing for the NSW Selective test needed '
          + 'practice that matched the real paper. So I started building a '
          + 'subscription platform in December 2025 that mirrors the exam '
          + 'format: topic-based question sets '
          + 'and five full mock papers per subject across Reading, '
          + 'Mathematical Reasoning, Thinking Skills and Writing. Users pay '
          + 'through Stripe, and n8n workflows handle AI marking on written '
          + 'responses. It has been live and taking paying subscribers since '
          + 'February 2026, acquired through Google and Meta ads I ran myself.',
        tech: [
          'React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui',
          'React Router v6', 'TanStack Query',
          'Supabase Postgres (21 tables, RLS on all)', 'Supabase Auth',
          'Supabase Edge Functions (Deno)',
          'Stripe (subscriptions + webhooks)', 'n8n',
          'Gemini 2.5 Flash via Lovable AI Gateway', 'Resend',
          'Lovable (build + hosting)',
        ],
        highlights: [
          '1,392 visitors and 5,167 pageviews since launch.',
          'Three figures in revenue within the first month.',
          '4.2% click-through rate, and 11% conversion from ad click to paid '
          + 'subscription.',
        ],
        links: [{ label: 'Live site', url: 'https://scorify100.com/' }],
      },
      {
        title: 'Nail Studio by H',
        launch: 'Jun 2026',
        client: 'Hannah',
        images: [
          { src: 'img/client/01-home-hero-desktop.jpg',
            caption: 'The landing page: what it is, where it is, and the one '
              + 'thing to do next.' },
          { src: 'img/client/08-booking-form-conditional-desktop.png',
            caption: 'The waiting list form. It posts to Apps Script, which '
              + 'notifies the owner.' },
          { src: 'img/client/nail-studio-gallery.jpg',
            caption: 'The gallery — recent work, tap any image to view.' },
        ],
        tagline: 'A customised website to suit a nail tech\'s needs.',
        description:
          'Designed and built a website for Hannah that streamlines her '
          + 'booking process, with clear, upfront pricing and a portfolio '
          + 'section showcasing her work. This made it easy for potential '
          + 'customers to see what they offer, know what it costs, and book '
          + 'directly.',
        tech: ['HTML', 'CSS', 'Vanilla JavaScript', 'Google Apps Script',
          'GitHub Pages'],
        highlights: [
          'Four static files, 1,769 lines, no dependencies and no build step.',
          'The booking form posts to a Google Apps Script endpoint, which '
          + 'notifies the owner so they can follow up on requests.',
        ],
        links: [{ label: 'Visit the site', url: 'https://nailstudiobyh.site/' }],
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
        image: null,
        tagline: 'The short version.',
        description:
          'Placeholder. A few sentences: what you do, what you are drawn to, '
          + 'and what you are looking for next.',
        links: [],
      },
      {
        title: 'What I work with',
        image: null,
        tagline: 'Tools and languages I reach for.',
        description:
          'Placeholder. List the things you would be happy to be handed a '
          + 'problem in.',
        tech: ['Placeholder', 'Placeholder', 'Placeholder'],
        links: [],
      },
      {
        title: 'Get in touch',
        image: null,
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
// A picture on a wall is one picture, not a set: `image` takes a path under
// img/, the same as a project entry. These want a caption rather than a
// write-up — a sentence or two about what you are looking at.
// ---------------------------------------------------------------------------

export const PAINTINGS = {
  // The Automations wing is a machine hall and hangs pipework rather than
  // pictures, so this key is unused. It stays so the four wings read as a set.
  automations: [null, null, null, null],
  personal: [
    { title: 'Placeholder — picture one', caption: 'Personal work tends to photograph better than client work. Use the good screenshots here.' },
    null,
    { title: 'Placeholder — picture three', caption: 'Another slot.' },
    null,
  ],
  // The Client Work wing is a boardroom and hangs charts rather than pictures,
  // so this key is unused. It stays so the four wings still read as a set.
  client: [null, null, null, null],
  // The About Me wing is a cinema and hangs nothing, so this key is unused.
  // It stays here so the four wings still read as a set.
  about: [null, null, null, null],
  // The atrium hangs four, two down each side wall: west top to bottom first,
  // then east. Nothing goes on its end wall — the résumé has that.
  atrium: [null, null, null, null],
};

// ---------------------------------------------------------------------------
// THE BOARDROOM
//
// The Client Work wing is a boardroom rather than a gallery: three clients
// standing round a table, and pressing E on one shows the work you did for
// them. There is no plinth in that room — the people are the exhibit.
//
// `name` has to match the `client` field on the projects above; that is the
// whole wiring. A client with nothing matching still stands there and says so.
//
// Three is the number the room is built for. Fewer and a place at the table
// stands empty; more and they queue up along the wall.
//
// `hair` is 'short' or 'long', and `palette` recolours hair, skin, shirt and
// trousers — between them, three people who don't look like triplets.
// ---------------------------------------------------------------------------

export const CLIENTS = [
  {
    name: 'Placeholder — first client',
    role: 'What they do, in three words',
    greeting: 'You built the thing that runs our mornings. Have a look.',
    hair: 'short',
    palette: { K: '#2E2018', S: '#C98F63', T: '#3A5A78', P: '#2A2E38' },
  },
  {
    name: 'Placeholder — second client',
    role: 'And what they do',
    greeting: 'Six months of spreadsheets, gone. Here is what replaced them.',
    hair: 'long',
    palette: { K: '#4A2418', S: '#8A5A3A', T: '#6B4A2E', P: '#33302C' },
  },
  {
    name: 'Placeholder — third client',
    role: 'Likewise',
    greeting: 'We had a deadline and no idea. Mostly the second part.',
    hair: 'short',
    palette: { K: '#1E1A18', S: '#E0B08A', T: '#4A5A46', P: '#2C2A30' },
  },
];

// ---------------------------------------------------------------------------
// THE RÉSUMÉ AND THE RULES
//
// Two things you can read in the atrium: the sheet of paper on the wall above
// the compass, and the book lying open on the lectern below it. Both take the
// same fields as a project entry, so `highlights`, `tech` and `links` all work.
//
// For the résumé, `links` is where the PDF goes — a file next to the page
// ('resume.pdf'), a data URI, or a link to wherever it already lives.
// ---------------------------------------------------------------------------

export const RESUME = {
  title: 'Harish — résumé',
  tagline: 'The short version, on one page.',
  description: 'Replace this paragraph with the summary you would put at the '
    + 'top of a CV: what you do, who you do it for, and what you are looking '
    + 'for next. Everything below is the same shape as a project entry.',
  highlights: [
    'A line per role, or per thing you are proud of.',
    'Delete any of these fields and they simply stop rendering.',
  ],
  tech: ['Python', 'JavaScript', 'n8n', 'Postgres'],
  links: [],
};

export const RULES = {
  title: 'House rules',
  tagline: 'Pinned open on the lectern, as museums do.',
  description: 'You are a small hovering droid in a museum of things Harish '
    + 'has built. There is no way out and nothing to lose — walk into any wing '
    + 'and read whatever is in it.',
  highlights: [
    'Arrow keys or WASD to walk.',
    'E, Enter or Space to look at whatever you are standing in front of.',
    'Esc closes anything that is open.',
    'The plinth in the middle of a wing opens that wing\'s work.',
    'Sit in the cinema chair in the About Me wing and the film starts.',
    'Leave the droid alone for a while and it powers down. Any key wakes it.',
  ],
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
