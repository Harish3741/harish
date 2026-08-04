// ---------------------------------------------------------------------------
// THIS IS THE ONLY FILE YOU NEED TO EDIT TO PUT YOUR REAL WORK IN.
//
// Automations and Projects hold real entries. Initiatives and About Me are
// still placeholder — replace them, keeping the shape.
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
//                + 'what happened after.',    // or an array, for two paragraphs
//     tech:        ['Python', 'n8n', 'Postgres'],
//     highlights:  ['Cut a 6-hour week to 20 minutes'],
//     links:       [{ label: 'Repo', url: 'https://…' }],
//     images:      [{ src: 'img/…', caption: 'What you are looking at.' }],
//   }
//
// PICTURES. `images` takes as many as you like; several become a filmstrip you
// swipe sideways, one at a time. A caption is optional. One picture and
// `image: 'img/…'` says the same thing more briefly.
//
// Pictures sit in a 3:2 frame, letterboxed rather than cropped. `ratio` on the
// entry changes that frame ('3 / 1' for a workflow canvas); `ratio` on a single
// picture overrules it, and 'auto' means no frame at all.
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
        title: 'Job Scraper',
        // A workflow canvas is about three times as wide as it is tall, so the
        // picture frame is too. In the default 3:2 the canvas rendered at the
        // same size with 200px of empty frame under it.
        ratio: '3 / 1',
        images: [{ src: 'img/automations/job-scraper-workflow.png',
          caption: 'Searches jobs, scores them and stores them in a sheet' }],
        tagline: 'An n8n workflow that finds job postings and scores them '
          + 'against my own criteria.',
        description: [
          'I wanted a way to catch suitable roles without manually checking '
          + 'each site every week and without drowning in irrelevant jobs. So '
          + 'I built this.',
          'A Claude research routine finds which companies are hiring the most '
          + 'right now for the roles I care about and sends that list into n8n '
          + 'via webhook, where it\'s checked against Greenhouse/Lever/Ashby '
          + 'and logged to a sheet. A separate Adzuna branch searches directly '
          + 'by job title in parallel. Every new posting from both branches '
          + 'gets deduped and scored 0-10 by an OpenAI node against a written '
          + 'description of roles I actually want. Only postings that clear '
          + 'the bar get written to a Google Sheet with the score.',
        ],
        highlights: [
          'Scores every new posting against my actual fit criteria instead of '
          + 'just keyword matches, so what lands in the sheet is consistently '
          + 'relevant',
          'Saves 2-3 hours a week I used to spend manually searching and '
          + 'filtering listings',
          'Planning to extend it to auto-draft a customised resume per job, '
          + 'pulled from my documented achievements',
        ],
      },

      {
        title: 'Spending Tracker',
        ratio: '3 / 1',
        images: [
          { src: 'img/automations/spending-tracker-workflow.png',
            caption: 'Reads the card alert, categorises it and logs it to a sheet' },
          // The two halves of what it produces, in one view rather than two.
          // Both take their own shape rather than the wide frame the workflow
          // wants: the summary is square, and squeezed into a 3:1 frame it
          // would come out a third of the width and unreadable.
          { src: 'img/automations/spending-tracker-data.png', ratio: 'auto',
            caption: 'Every transaction, categorised, as it lands in the sheet' },
          { src: 'img/automations/spending-tracker-graph.png', ratio: 'auto',
            caption: 'The month against budget, at a glance' },
        ],
        tagline: 'An n8n workflow that logs and categorises every card '
          + 'transaction',
        description:
          'This automation is a personal spending tracker that watches Gmail '
          + 'every minute for "Transaction Update" alert emails from my '
          + 'American Express card. Whenever one arrives, it extracts the '
          + 'merchant name, amount, and date from the email text, uses an AI '
          + 'model to automatically categorize the purchase as Food, '
          + 'Essentials, Subscriptions, Travel, or Other, then logs all of '
          + 'that into a Google Sheet and labels the email so it\'s marked as '
          + 'processed. The google sheet is customised so data entered for the '
          + 'month can be easily seen through a graph.',
        highlights: [
          'No need for manual tracking of my expenditure',
          'Helped me reduce my spending',
        ],
      },

      {
        title: 'Lead Gen',
        ratio: '3 / 1',
        images: [
          { src: 'img/automations/lead-gen-maps-scraper.png',
            caption: 'Finds the businesses and pulls their details' },
          // this canvas is a longer, thinner run than the first
          { src: 'img/automations/lead-gen-website-scraper.png', ratio: '4 / 1',
            caption: 'Digs an email out of each one and sends the first note' },
        ],
        tagline: 'An n8n workflow that finds businesses and their details',
        description:
          'This automation is a two-step lead-gen and outreach machine built '
          + 'in n8n. The first workflow searches Google Maps for local '
          + 'businesses matching a keyword and pulls their names, addresses, '
          + 'and phone numbers across multiple result pages. Then it removes '
          + 'duplicates and previously-contacted and saves the new ones. A '
          + 'second workflow is triggered which looks up each business\'s '
          + 'website, scrapes the page for a contact email (even decoding '
          + 'hidden or obfuscated addresses), filters out junk emails and '
          + 'updates a spreadsheet with what it finds. If a real email turns '
          + 'up, we are able to send a pre-written cold outreach email.',
        highlights: [
          'Used it to find leads for Scorify (my edtech platform)',
          'Helped me compare prices for when I wanted to tint my car',
          'Can be edited to find any business',
        ],
      },
    ],
  },

  {
    id: 'personal',
    title: 'Initiatives',
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
    ],
  },

  {
    id: 'client',
    title: 'Projects',
    blurb: 'Built for other people, to a brief and a deadline.',
    projects: [
      {
        title: 'Scorify',
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
          + 'Mathematical Reasoning, Thinking Skills and Writing. It has been '
          + 'live and taking paying subscribers since February 2026, acquired '
          + 'through Google and Meta ads I ran myself.',
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
          '1,392 visitors and 5,167 pageviews since launch',
          '3 figure revenue within first month',
          '4.2% click through rate and 11% conversion rate from ad click to '
          + 'paid subscription',
        ],
        links: [{ label: 'Visit site', url: 'https://scorify100.com/' }],
      },
      {
        title: 'Nail Studio by H',
        launch: 'Jun 2026',
        client: 'Hannah',
        images: [
          { src: 'img/client/01-home-hero-desktop.jpg',
            caption: 'The landing page' },
          { src: 'img/client/08-booking-form-conditional-desktop.png',
            caption: 'The waiting list form. It posts to Apps Script which '
              + 'notifies the owner.' },
          { src: 'img/client/nail-studio-gallery.jpg',
            caption: 'A gallery of recent work. User can tap any image to '
              + 'view.' },
        ],
        tagline: 'A customised website to suit a nail techs need.',
        description:
          'Designed and built a website for Hannah that streamlines her '
          + 'booking process, with clear, upfront pricing and a portfolio '
          + 'section showcasing her work. This made it easy for potential '
          + 'customers to see what they offer, know what it costs, and book '
          + 'directly.',
        tech: ['HTML', 'CSS', 'Vanilla JavaScript', 'Google Apps Script',
          'GitHub Pages'],
        highlights: [
          'automated messages to business owner on new booking requests',
          'saves the business 4-5 hours weekly',
          'monthly upkeep the website to update policies, gallery and to '
          + 'customise flow',
        ],
        links: [{ label: 'Visit the site', url: 'https://nailstudiobyh.site/' }],
      },

      {
        title: 'This Museum',
        launch: '2026',
        // the captures are 1200x750, so the frame is their own shape exactly
        ratio: '8 / 5',
        images: [
          { src: 'img/client/this-museum-title.png',
            caption: 'Where you come in' },
          { src: 'img/client/this-museum-atrium.png',
            caption: 'The atrium, with a way into each of the four rooms' },
          { src: 'img/client/this-museum-wing.png',
            caption: 'Inside a room, standing at something you can press' },
        ],
        tagline: 'A portfolio of things I\'ve built in a 2D game.',
        description:
          'It felt boring to list out all the things I\'ve done when trying to '
          + 'introduce myself. I wanted a fun way for someone to know what '
          + 'I\'ve done so I decided to built an interactive game with a '
          + 'collection of everything I\'ve done',
        tech: ['JavaScript', 'HTML Canvas'],
        highlights: [
          'built with no framework, no dependencies and no build step',
          'each room is set up differently so it doesn\'t feel like the same '
          + 'list four times',
          'there\'s a plain list for anyone who doesn\'t want to play through it',
        ],
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
// The atrium hangs four framed pictures. Give an entry here and that frame
// becomes something you can walk up to and read; leave it out and it says so
// and points back at this file, because a frame that swallows the keypress
// teaches you not to press E at the next one.
//
// A picture on a wall is one picture, not a set: `image` takes a path under
// img/, the same as a project entry. These want a caption rather than a
// write-up — a sentence or two about what you are looking at.
// ---------------------------------------------------------------------------

export const PAINTINGS = {
  // The atrium is the only room that hangs pictures now: four, two down each
  // side wall, west top to bottom first, then east. Nothing goes on its end
  // wall — the résumé has that. Every wing is dressed as itself instead — a
  // machine hall, a boardroom, a cinema, and Initiatives' plinth and benches.
  atrium: [null, null, null, null],
};

// ---------------------------------------------------------------------------
// THE BOARDROOM
//
// The Projects wing is a boardroom rather than a gallery: three clients
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
