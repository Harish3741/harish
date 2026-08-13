// ---------------------------------------------------------------------------
// THIS IS THE ONLY FILE YOU NEED TO EDIT TO PUT YOUR REAL WORK IN.
//
// Every wing holds real entries. RESUME is deliberately blank — title only —
// and ABOUT.video is empty; the cinema says so rather than breaking.
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
//                  // `alt` instead of `caption` describes the picture without
//                  // printing a line under it
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
    blurb: 'Automating my to-do list one workflow at a time',
    projects: [
      {
        title: 'Job Scraper',
        // A workflow canvas is about three times as wide as it is tall, so the
        // picture frame is too. In the default 3:2 the canvas rendered at the
        // same size with 200px of empty frame under it. The frame is this
        // canvas's own shape rather than a round 3:1, which left a tenth of it
        // dark above and below for nothing.
        ratio: '1200 / 352',
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
        // Both pictures are within a whisker of this shape — the canvas is
        // 3.35:1 and the sheet 3.38:1 — so one frame fits the pair and neither
        // is boxed. The sheet used to declare its own, which changed the
        // frame's height as you swiped; the entry's old 3:1 fitted neither and
        // cost them both a tenth of their height to dark.
        ratio: '1600 / 474',
        images: [
          { src: 'img/automations/spending-tracker-workflow.png',
            caption: 'Reads the card alert, categorises it and logs it to a sheet' },
          // The two halves of what it produces, composited side by side at a
          // matched height so they read as one sheet rather than two views.
          { src: 'img/automations/spending-tracker-sheet.png',
            caption: 'Every transaction as it lands, and the month against '
              + 'budget' },
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
          // Both sit in the entry's 3:1 frame even though the second canvas is
          // a longer, thinner run. It used to declare its own 4:1, which was a
          // truer fit for that one picture and meant the frame changed height
          // as you swiped between them. One frame that stays put beats two that
          // each fit perfectly; the wider canvas letterboxes into the dark.
          { src: 'img/automations/lead-gen-maps-scraper.png',
            caption: 'Finds the businesses and pulls their details' },
          { src: 'img/automations/lead-gen-website-scraper.png',
            caption: 'Scrapes the website to find email. If successful it '
              + 'automatically sends an email' },
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

      {
        title: 'Team Task Reminder',
        // The canvas's own shape, the way the other three workflows are framed.
        ratio: '2532 / 1144',
        images: [{ src: 'img/automations/task-reminder.png',
          caption: 'Checks Notion for tomorrow\u2019s tasks and nudges the '
            + 'assignee on Discord' }],
        tagline: 'An n8n workflow that sends reminders for my current team',
        description: [
          'Leading a team means checking up on people to ensure they are on '
          + 'track with their. I hated being a nag and it felt like a waste of '
          + 'my energy to remember so I built this.',
          'Every day n8n checks our Notion task board for anything due tomorrow '
          + 'that isn\'t already done or already chased. If it finds something, '
          + 'it matches the assignee to their Discord and posts a nudge in the '
          + 'channel tagging them with the task and a link back to Notion.',
          'None of this is specific to a team. The database, channel and '
          + 'assignee map are just fields and I can point it at a different '
          + 'Notion board and Discord server. This way it runs seamlessly for '
          + 'whatever event I\'m dealing with next.',
        ],
        highlights: [
          'Saves me the strain of context switching during event organisation',
          'Sets a healthy culture of team not feeling micromanaged but still '
          + 'supported',
          'Can be reused with any team',
        ],
      },

      {
        title: 'Email Flagger',
        // Both canvases are still to come. They are commented out rather than
        // committed ahead of their files: an unresolved path still fires a
        // request before the dashed slot replaces it, and measured, that was
        // four 404s on every page load — noise in the console of anyone who
        // opens one. Uncomment when the files land, and give the entry the
        // canvases' own `ratio` the way the other four workflows are framed.
        // images: [
        //   { src: 'img/automations/email-flagger-personal.png',
        //     caption: 'Checks every email for job-related mail and notifies me '
        //       + 'only when it needs a reply' },
        //   { src: 'img/automations/email-flagger-society.png',
        //     caption: 'Holds each email two days, then pings the right exec on '
        //       + 'Discord if nobody replied' },
        // ],
        tagline: 'An n8n workflow that reads all incoming emails and flags the '
          + 'ones specified',
        description: [
          'If you say you\u2019ve never forgotten to reply to an email because '
          + 'it got drowned in your inbox then you\u2019re just lying to me. So '
          + 'to deal with this I built this flow.',
          'The first one watches my personal inbox while I\'m job hunting. '
          + 'Every email gets checked for whether it\'s job related and if it '
          + 'is, an AI pass decides whether it actually needs a response from '
          + 'me. Only those come through to my phone as a separate '
          + 'notification.',
          'The second one watches our society inbox, where things get read and '
          + 'assumed as someone else\'s problem resulting in it never being '
          + 'answered. It holds each email for two days, goes back to check '
          + 'whether anyone replied and if nobody did, works out what the '
          + 'sender wants and pings the related exec member on Discord with a '
          + 'short summary. Emails from companies get logged to Notion so '
          + 'there\'s a record.',
        ],
        highlights: [
          'Increased reply rate by 30%',
          'No more missed opportunities due to missed emails',
          'Can be reused for any category',
        ],
      },
    ],
  },

  {
    id: 'personal',
    title: 'Initiatives',
    blurb: 'Talent is something you make bloom, instinct is something you polish.',
    projects: [
      {
        title: 'No-Code UNSW',
        // The society is its events, so they get a row of their own rather
        // than one description trying to cover four things at once.
        events: [
          {
            name: 'Notion Workshop',
            date: '19 March 2026',
            description: [
              'Most students run a whole degree without a system. Notes '
              + 'scattered across three apps, deadlines that turn up out of '
              + 'nowhere, and a group assignment nobody can find the plan for.',
              'So we ran a workshop that walked students through building one '
              + 'from scratch. Everyone left with a Notion workspace they had '
              + 'built themselves and could keep using for the rest of the '
              + 'semester, rather than a template we handed over.',
            ],
            highlightsLabel: 'What everyone built',
            highlights: [
              'assignment and deadline dashboards',
              'class note systems',
              'databases with filters, sorts and relations',
              'kanban boards for projects',
              'shared workspaces for group assignments',
              'templates to reuse all semester',
            ],
            links: [{ label: 'Read the post',
              url: 'https://www.linkedin.com/posts/harish-prabhu-9a93b0284_build-your-notion-workspace-ncsunsw-x-notion-share-7439486172327813120-NSZB/' }],
          },
          {
            name: 'Debugged',
            date: '6 June 2026',
            description: [
              'Every student has a list of things about their campus that '
              + 'annoy them, and almost none of those complaints ever becomes '
              + 'anything. Debugged was a one-day hackathon built on the idea '
              + 'that they should.',
              'Teams picked a real social or community problem on campus and '
              + 'built a working mini-app for it, start to finish, in a single '
              + 'day. Some of the best ideas of the day were things people had '
              + 'been walking past for years.',
            ],
            highlights: [
              'a campus complaint to a working app in one day',
              'partnered with A1Zap a YC backed startup focused on bringing AI '
              + 'into our social lives',
              'run with AI UNSW, A1Zap and UNSW Founders',
              'judged the final pitches',
            ],
            // Straight off the camera at 7008px and 17MB for the three, which
            // is more base64 than the single-file build can carry. Resized to
            // 1600 wide — twice what the panel can ever show one at.
            images: [
              { src: 'img/personal/debugged-hacking-2.jpg',
                alt: 'The floor, a few hours in' },
              { src: 'img/personal/debugged-hacking-1.jpg',
                alt: 'A team building their app' },
              { src: 'img/personal/debugged-judging.jpg',
                alt: 'Judging the pitches at the end of the day' },
            ],
            links: [{ label: 'Read the post',
              url: 'https://www.linkedin.com/posts/harish-prabhu-9a93b0284_holy-moly-we-broke-a1zap-by-a1base-yc-w25-ugcPost-7469957528953552897-pJ9r/' }],
          },
          {
            name: 'Framer Workshop',
            date: '25 June 2026',
            description: [
              'Everyone applying for the same roles hands in the same '
              + 'document. A resume says what you have done in the shape '
              + 'everyone else says it in, and none of it is yours. We wanted '
              + 'to give students something that was.',
              'A two-hour evening session in the Tyree Tech Building, building '
              + 'a personal site in Framer from nothing. Everyone arrived with '
              + 'a laptop and left with a site that was actually live, rather '
              + 'than a half-finished tutorial to come back to.',
            ],
            highlights: [
              'everyone left with a live portfolio site',
              'built in Framer, start to finish, in two hours',
            ],
            links: [{ label: 'Read the post',
              url: 'https://www.linkedin.com/posts/no-code-society_unsw-job-'
                + 'resume-activity-7473589089993400320-bh6E' }],
          },
          {
            name: 'Healthack',
            date: '18-19 July 2026',
            description: [
              'Healthcare problems are obvious to the people working in '
              + 'healthcare and invisible to everyone else. Healthack put both '
              + 'in the same room for a weekend.',
              'Builders, clinicians and industry leaders worked together on '
              + 'real healthcare problems.',
            ],
            highlights: [
              '120 attendees across UNSW and general public',
              'over $15K USD in prizes',
              'ChatGPT Pro for a year for the top five teams',
              'partnered with MLAI and StatDoctor',
              'sponsored by Codex, Base44, What The Health',
              'hosted at Stone & Chalk, Tech Central',
            ],
            images: [
              { src: 'img/personal/healthack-2.jpg',
                alt: 'Teams building, deep into the weekend' },
              { src: 'img/personal/healthack-1.jpg',
                alt: 'Builders and clinicians in the same room' },
            ],
            links: [{ label: 'Read the post',
              url: 'https://www.linkedin.com/posts/harish-prabhu-9a93b0284_healthhack-sydney-luma-share-7477531462825795584-6_k9/' }],
          },
          {
            name: 'Hack for Humanity',
            date: '5-6 September 2026',
            status: 'Event in progress',
            description: [
              'Non-profits have real software problems and no budget to solve '
              + 'them. Students have the time and, now, the tools. Hack for '
              + 'Humanity puts the two together for a weekend.',
              'Cross-university teams pick one of three non-profit partners, '
              + 'work from a brief that organisation wrote themselves, and '
              + 'build a working MVP on Base44 across two days.',
            ],
            highlights: [
              'judged by Omer Shai, CMO at Wix',
              'supporting winning teams to keep building with non-profits',
              'coordinating with Base44, Enactus UNSW, AISOC MQ and UTS TechSoc',
            ],
          },
        ],
        tagline: 'Co-founded a tech society for building apps and automations '
          + 'without code',
        description: [
          'Students are always thinking up ideas and not going through with it '
          + 'because they think they need high technical skills to build their '
          + 'product. We wanted to show them, now more than ever, anyone can '
          + 'build anything.',
          'No-Code UNSW is a tech society focused on building apps, '
          + 'automations and tools using no-code or low-code platforms instead '
          + 'of traditional programming. As Co-Founder and Co-President I '
          + 'helped start the society and now guide its direction by '
          + 'organising events, coordinating with the team and creating a '
          + 'space where students feel empowered.',
        ],
        highlights: [
          'secured collabs with Notion Sydney, UNSW Founders, A1ZAP (VC backed '
          + 'startup), MLAI and Base44',
          'run workshops and events for students building real projects',
          'organised overnight hackathons with over 150 attendees at offsite '
          + 'locations such as stone and chalk',
          'coordinated interuniversity with USYD, MQ and UTS to organise events',
        ],
      },

      {
        title: 'RAPSOC UNSW',
        images: [],
        tagline: 'Co-founded and President of RAPSOC at UNSW',
        description: [
          'We wanted to create a community centred around music, performance '
          + 'and freedom. RAPSOC is a space where students feel comfortable '
          + 'sharing the beat they made when they were 12 or the rap they '
          + 'randomly sang in the shower.',
          'As Co-Founder and President I helped bring the society to life and '
          + 'grew it from a small exec only team of 7 to now a 45 '
          + 'member team. I oversee all planning and decision making across '
          + 'marketing, HR, creatives and events.',
        ],
        highlights: [
          'built an established UNSW society from ground up',
          'over 300 members',
          'organised social events such as pubcrawls with over 100 attendees '
          + 'at a time',
          'weekly community based events such as beat making workshop, games '
          + 'night, etc.',
          'secured collaborations with established societies such as enactus, '
          + 'CEVsoc, FABsoc, etc.',
        ],
      },

      {
        title: 'Toastmasters UNSW',
        // One rectangle rather than two slides: the two shots are composited
        // side by side at a matched height, so the portrait one sits next to
        // the landscape one without either being cropped or left in a gap.
        ratio: '1400 / 642',
        images: [{ src: 'img/personal/toastmasters-speaking.jpg' }],
        tagline: 'Treasurer of a public speaking and leadership club at UNSW',
        description:
          'Toastmasters UNSW is a public speaking and leadership club where '
          + 'students practise giving speeches, thinking on their feet and '
          + 'giving each other feedback in a structured, supportive setting. '
          + 'As Treasurer I looked after the club\'s money. I track income and '
          + 'spending, helped plan budgets for events and make sure payments, '
          + 'reimbursements and records were accurate so the club can keep '
          + 'running smoothly.',
        highlights: [
          'increased the society\'s profits by 12%',
          'maintained well organised financials',
          'built a custom flow to track spending and income',
        ],
      },
    ],
  },

  {
    id: 'client',
    title: 'Projects',
    blurb: 'Built for monetisation',
    projects: [
      {
        title: 'Scorify',
        launch: 'Feb 2026',
        // The dashboard's own shape. Six of the seven screenshots are within a
        // few pixels of it, so they sit in the frame almost exactly; the tall
        // writing-marking one letterboxes sideways rather than making the frame
        // change height halfway through the tour.
        ratio: '1934 / 1177',
        // In the order a student meets them: pick a subject, pick a topic, sit
        // the questions, get them back marked, and then look at what that says
        // about you over time.
        images: [
          { src: 'img/client/scorify-1-dashboard-home.png',
            alt: 'The student dashboard, with overall progress and a bar for '
              + 'each of the four subjects' },
          { src: 'img/client/scorify-2-topic-selection.png',
            alt: 'Choosing a topic in Mathematical Reasoning, and how many '
              + 'questions to practise' },
          { src: 'img/client/scorify-3-exam-interface.png',
            alt: 'A question under timed conditions, with the clock, the '
              + 'question count and a flag button' },
          { src: 'img/client/scorify-4-instant-feedback.png',
            alt: 'The same question marked, showing the correct answer and the '
              + 'working behind it' },
          { src: 'img/client/scorify-5-ai-writing-marking.png',
            alt: 'AI marking on a writing task: a score out of 25, a criteria '
              + 'breakdown, and written feedback on what worked and what to fix' },
          { src: 'img/client/scorify-6-analytics-history.png',
            alt: 'Analytics: every past attempt with its score, the time taken '
              + 'and any violations' },
          { src: 'img/client/scorify-7-analytics-flagged.png',
            alt: 'Questions flagged for study, grouped by subject' },
        ],
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
        // Trimmed to the ones that say something about the build. Dropped the
        // build tool, the component library, the router, the hosting, the mail
        // service and the model gateway — all real, none of them a decision
        // anyone would ask about.
        tech: [
          'React 18', 'TypeScript', 'Tailwind CSS', 'TanStack Query',
          'Supabase', 'Stripe', 'n8n',
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
        title: 'ForkIt',
        launch: 'May 2026',
        // Phone screenshots, so they are composited into one sheet rather than
        // shown one at a time: a single portrait shot in this frame wastes two
        // thirds of it to dark. Four side by side fill it, and the whole run
        // through the app reads in one picture instead of a swipe.
        ratio: '2912 / 1556',
        images: [
          { src: 'img/client/forkit-home-to-match.jpg',
            alt: 'Four screens of the app: the home screen, the preferences '
              + 'screen with walking distance, cuisine, price range and a '
              + 'group session code, a restaurant card being swiped with three '
              + 'people in the session, and the match screen once everyone '
              + 'agrees on one' },
        ],
        tagline: 'A phone app where groups swipe through restaurants and '
          + '\u2018match\u2019 on the first one everyone likes.',
        description: [
          'Deciding where to eat with my girlfriend or friends turned into '
          + 'such a hassle as nobody wanted to be the one to pick. So I '
          + 'decided to build an app to make it easier.',
          'It\u2019s simple: one person sets a couple metrics like walking '
          + 'radius and optional cuisine/ price limits. Then the app builds a '
          + 'deck of the restaurants that fit and generates a code. The code '
          + 'can be shared so that everyone can swipe right for yes and left '
          + 'for no on the deck of restaurants till one place has a majority '
          + 'vote.',
          'It has been in use since May 2026 with my friends through local '
          + 'hosting. Soon I will submit it to the app store so that everyone '
          + 'can use it!',
        ],
        // Same trim as Scorify: the framework, the language, the backend and
        // the two APIs the app would not work without. Dropped the Expo SDK
        // version, the navigation library, the gesture and animation
        // libraries and expo-location \u2014 all real, none of them a decision
        // anyone would ask about. Firebase is one line rather than its auth
        // and its database separately.
        tech: [
          'React Native', 'TypeScript', 'Firebase',
          'Google Places API', 'Google Routes API',
        ],
        highlights: [
          'In regular personal use since May 2026, running against a live '
          + 'Firebase project and Google Places key.',
          'All information is pulled from Google Places API so it\u2019s '
          + 'consistently updated and accurate',
        ],
      },

      {
        title: 'Nail Studio by H',
        launch: 'Jun 2026',
        client: 'Hannah',
        images: [
          { src: 'img/client/01-home-hero-desktop.jpg',
            alt: 'The landing page' },
          { src: 'img/client/08-booking-form-conditional-desktop.png',
            alt: 'The waiting list form. It posts to Apps Script which '
              + 'notifies the owner.' },
          { src: 'img/client/nail-studio-gallery.jpg',
            alt: 'A gallery of recent work. User can tap any image to '
              + 'view.' },
        ],
        tagline: 'A customised website to suit a nail tech\'s need.',
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
        launch: 'Aug 2026',
        // the captures are 1200x750, so the frame is their own shape exactly
        ratio: '8 / 5',
        images: [
          { src: 'img/client/this-museum-title.png',
            alt: 'Where you come in' },
          { src: 'img/client/this-museum-atrium.png',
            alt: 'The atrium, with a way into each of the four rooms' },
          { src: 'img/client/this-museum-wing.png',
            alt: 'Inside a room, standing at something you can press' },
        ],
        tagline: 'A portfolio of things I\'ve built in a 2D game.',
        description:
          'It felt boring to list out all the things I\'ve done when trying to '
          + 'introduce myself. I wanted a fun way for someone to know what '
          + 'I\'ve done so I decided to build an interactive game with a '
          + 'collection of everything I\'ve done. Player is able to move around '
          + 'into different rooms and explore all the work I\'ve done with '
          + 'photos and descriptions of each project.',
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
        title: 'Harish',
        tagline: 'UNSW student who builds apps, automations and societies.',
        description: [
          'I build things. Most of what\'s in this museum started because '
          + 'something was annoying me or someone I know had a problem worth '
          + 'solving, so I built it instead of leaving it as an idea.',
          'Despite not having a technical background, I\'ve always been eager '
          + 'to try new products that can make my life easier.',
        ],
        highlightsLabel: 'Boring Facts.',
        highlights: [
          'I love playing literally any sport other than cricket (although I '
          + 'suck at every sport)',
          'UNSW Actuarial student graduating EOY 2026 with a distinction WAM',
        ],
        images: [],
        // The closing line sits under the pictures, next to the button it is
        // talking about — a "reach me here" three paragraphs above the link
        // is pointing at something you cannot see yet.
        outro: 'LinkedIn DM is the best. Happy to talk about work, a build you '
          + 'want done or anything in this museum!',
        links: [{ label: 'LinkedIn',
          url: 'https://www.linkedin.com/in/harish-prabhu-9a93b0284' }],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// THE BOARDROOM
//
// The Projects wing is a boardroom rather than a gallery: three figures round a
// table, and the table itself is what opens the wing's work.
//
// The figures are scenery. They carried a name, a role and a greeting once, for
// a version where you pressed E on a person to see their project — that never
// shipped, and the fields sat unread in the content file and in the published
// page for months afterwards. What is left is what is actually drawn.
//
// Three is the number the room is built for. Fewer and a place at the table
// stands empty; more and they queue up along the wall.
//
// `hair` is 'short' or 'long', and `palette` recolours hair, skin, shirt and
// trousers — between them, three people who don't look like triplets.
// ---------------------------------------------------------------------------

export const CLIENTS = [
  {
    hair: 'short',
    palette: { K: '#2E2018', S: '#C98F63', T: '#3A5A78', P: '#2A2E38' },
  },
  {
    hair: 'long',
    palette: { K: '#4A2418', S: '#8A5A3A', T: '#6B4A2E', P: '#33302C' },
  },
  {
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
  // Blank on purpose. The title is the window's header and the plain list's
  // button label, so it stays; everything below it is Harish's to write.
  // Add `tagline`, `description`, `highlights`, `tech` and `links` back and
  // they render in that order — `links` is where a PDF goes when there is one.
  title: 'Harish — résumé',
};

export const RULES = {
  title: 'House rules',
  description: 'You are a small hovering droid in a museum of things Harish '
    + 'has built. So go ahead explore all the wings and try interacting with '
    + 'everything you find!',
  highlights: [
    'Arrow keys or WASD to walk.',
    'E, Enter or Space to look at whatever you are standing in front of.',
    'Esc or E closes anything that is open.',
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
