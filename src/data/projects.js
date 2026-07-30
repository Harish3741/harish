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

/** Look a wing up by the id used on its plinth. */
export function wingById(id) {
  return WINGS.find((w) => w.id === id) || null;
}
