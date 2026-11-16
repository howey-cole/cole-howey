# Cole Howey — personal site (starter)

A chat home page with a sidebar (About, Work, School, Projects, Contact). The chatbot answers only from the public content files in `content/`.

## Status of this starter

- Written without being run against the Claude API or deployed. The content build, the local server and the page were run locally; the first real chat reply will happen on your machine.
- The site is hidden from search engines until you change `public/robots.txt` and the robots tag in `public/index.html`.

## What is where

| Folder | What it holds |
|---|---|
| `content/` | The public knowledge base. One markdown file per role, school or project. This is the only thing the bot knows. |
| `bot/` | The bot's rules (`system-prompt.md`) and its test set (`test-questions.json`). |
| `public/` | The web page: `index.html`, `styles.css`, `app.js`. |
| `api/chat.js` | The server function that calls the Claude API and keeps the key off the browser. |
| `scripts/` | Build, local preview and bot test scripts. |
| `lib/knowledge.js` | Generated. Do not edit. |
| `CLAUDE.md` | Rules Claude Code reads automatically when you work in this folder. |

## First run (about one evening)

1. Install [Node.js](https://nodejs.org) (version 20 or later) and [Git](https://git-scm.com).
2. Open a terminal in this folder and run `npm run dev`, then open http://localhost:3000. The pages work now; the chat says it is not set up.
3. Create an Anthropic API key in the Claude Console. **Set a monthly spend limit on it** before using it. This is billed separately from your Claude subscription.
4. Copy `.env.example` to `.env.local`, paste the key, and restart `npm run dev`. The chat now answers.
5. Run `npm run test:bot` and grade the answers in `bot/test-results.md`.

If the API rejects the model name, set `ANTHROPIC_MODEL` in `.env.local` to a current model from the Claude API documentation.

## Editing content

1. Edit or add a file in `content/`. Keep the frontmatter block at the top.
2. Set `status: draft` to keep a page off the site and out of the bot.
3. Run `npm run build` (or restart `npm run dev`).
4. Re-run `npm run test:bot` after any change to content or bot rules.

## Deploying (when ready)

1. Create a GitHub account and a **private** repository, then push this folder to it.
2. Import the repository in Vercel (free Hobby plan). It reads `vercel.json`.
3. In Vercel project settings, add the environment variable `ANTHROPIC_API_KEY`.
4. Test on the free `vercel.app` address.

## Before launch

- [ ] Review every file in `content/` as if a stranger, a recruiter and your employer will read it.
- [ ] Check your employer's policy on describing your work publicly.
- [ ] Fill in `content/contact.md` and the `LINKS` in `public/app.js`.
- [ ] Publish or delete `content/interests.md`.
- [ ] All bot tests graded as pass.
- [ ] Spend limit set on the API key.
- [ ] Buy the domain and connect it in Vercel.
- [ ] Remove the search-engine block (`public/robots.txt` and the robots tag in `public/index.html`).
