# Filling the museum

Two things live here: a prompt to send the agents that helped build each
project, and the shape to hand their answers back in.

Everything ends up in `src/data/projects.js`. Nothing else needs touching.

---

## 1. The prompt to send each agent

Paste this into a session that has the project's code or history. One project
at a time — a session that worked on three things will blur them together.

> You worked with me on this project. I'm putting it in a portfolio and I need
> a factual write-up plus pictures. Don't invent anything: where you don't
> know, write `unknown` and I'll fill it in myself. Don't inflate outcomes —
> if we never measured something, say so.
>
> **A. The entry.** Give me exactly this, as one JS object I can paste:
>
> ```js
> {
>   title: '',        // what it is called. 2-5 words
>   year: '',         // when it shipped, or when it was last worked on
>   image: null,      // leave null, I'll fill it in
>   tagline: '',      // one line. What it is, in plain words, no adjectives
>   description: '',  // 2-4 sentences: the problem, what we decided, what happened after
>   tech: [],         // what it is actually built on. No aspirational entries
>   highlights: [],   // 1-3 concrete outcomes. Numbers if we have them, nothing if we don't
>   links: [],        // [{ label: 'Repo', url: '…' }] — only links that resolve
> }
> ```
>
> **B. Why it was built.** Two or three sentences on what was happening before
> it existed. What was manual, what kept breaking, what it cost. Concrete, past
> tense — not what it aspires to be.
>
> **C. How it is used.** Who runs it, how often, what triggers it, what it
> produces, and where the output goes. Say plainly whether it is still running
> or has been retired.
>
> **D. Pictures.** List the paths of any screenshots, diagrams or exports
> already in this repo. If there are none and the project has a UI, dashboard,
> workflow canvas or output document worth showing, tell me exactly where to
> capture it — the URL, the file, or the command to run. If you can produce a
> screenshot or render a diagram yourself, do it and give me the path.
>
> **E. Anything I can't publish.** Flag anything under NDA or otherwise
> sensitive, and give me a second version of the description that keeps the
> shape of the problem without naming the client, the numbers or the systems.

### One line to add depending on the wing

- **Client work** — "Also give me the client's name as I should print it, or a
  neutral stand-in ('a logistics company') if it can't be named."
- **Automations** — "Say what fires it: a schedule, a webhook, a file landing,
  someone pressing a button. And roughly how often it runs."
- **Personal projects** — "Say what made you want it to exist. That is the
  interesting part for this one, more than the outcome."

---

## 2. What to send me

Best case: the JS objects, grouped by wing, exactly as above. They drop
straight into `src/data/projects.js`. Prose is fine too — I'll convert it —
but the objects skip a step and skip my guesswork.

```js
// AUTOMATIONS
{ title: '…', year: '…', image: null, tagline: '…', description: '…',
  tech: ['…'], highlights: ['…'], links: [] },

// CLIENT WORK — same, plus one extra field:
{ title: '…', client: 'Acme Ltd', … },
```

### Pictures

Send me the image files and say which project each belongs to. Don't base64
anything — I'll do the conversion, because the single-file build needs data
URIs and the served version doesn't, and getting that wrong is invisible until
it breaks.

What photographs well here:

- **Landscape**, roughly 3:2 or 16:9. The panel it appears in is wider than it
  is tall.
- **Cropped tight** to the thing worth seeing. The panel is around 600px wide
  on a laptop, so a full-screen capture of a dense dashboard reads as grey mush.
- **One idea per picture.** A chart, a workflow canvas, a before/after. Not a
  whole screen with nine panels on it.
- Anything with a client name, a real customer record or a token in it needs
  blurring first — say so and I'll leave it out until you send a clean one.

---

## 3. Where each piece surfaces

| You give me | Where it shows up |
| --- | --- |
| `title`, `year` | the list rail on the left of the exhibit window |
| `tagline` | the brass line under the title |
| `image` | a framed picture in the panel; a dashed *photo goes here* until then |
| `description`, `highlights`, `tech`, `links` | the body of the panel |
| `client` | a small line above the description, and in the skip-to-list |

Rooms and how much each holds:

| Wing | What opens the list | How many entries |
| --- | --- | --- |
| Automations | any of the three machines | any number |
| Personal projects | the plinth | any number |
| Client work | the boardroom table | any number |
| About me | the character by the door | any number |

Plus, separately from the project lists:

- **8 wall pictures** — 4 in the gallery, 4 down the atrium's side walls. Each
  takes `{ title, caption, image }` in `PAINTINGS`. These are a caption and a
  picture, not a project: one or two sentences about what you're looking at.
- **The résumé** — the sheet on the atrium wall. Same fields as a project.
  `links` is where the PDF goes.
- **The film** — `ABOUT.video`, played when you sit in the cinema chair. Any
  format a browser plays. A `videoPoster` still is optional but worth having.
- **The three figures round the boardroom table** are decoration. They take a
  `hair` and a `palette` in `CLIENTS`, nothing else.
