# Project rules for Claude Code

This is Cole Howey's personal website: a chat home page plus content pages. The chatbot answers only from the public content in `content/`.

## Content rules (do not break these)

- **Public content only.** `content/` holds what any visitor may read: job history, education, skills, finished projects. Never add salary or pay details, job-search activity (applications, target companies, contacts, interview status), or anything stating Cole is looking for a role.
- **No information from the general internet.** Content comes from Cole, not from web searches about him.
- **Dick's Sporting Goods:** high-level descriptions of the work only. No dollar values and no internal detail beyond what is already in `content/work/`.
- **True as of today.** Future courses are "planned" with their quarter. Do not describe planned coursework or unfinished projects as completed.
- **No overclaiming.** Do not add a skill, tool, title or metric unless Cole confirms it. Overseeing a team's code is not the same as writing it.
- **Bot voice:** third person, states it is an AI, plain text.
- A file with `status: draft` in its frontmatter is excluded from the site and the bot.

## How it works

- `content/**/*.md`: one file per role, school or project. Frontmatter: `title`, `section` (about, work, school, projects, interests, contact), `order`, `status`.
- `bot/system-prompt.md`: the chatbot's rules. `bot/test-questions.json`: the test set.
- `scripts/build-content.mjs`: generates `public/content.json` (pages) and `lib/knowledge.js` (bot knowledge). Run `npm run build` after any content change.
- `api/chat.js`: server function that calls the Claude API. The API key lives only in `.env.local` (local) and Vercel environment variables (deployed).
- `public/`: the front end (plain HTML, CSS, JavaScript; no framework, no dependencies).

## After changing content or bot rules

1. `npm run build`
2. `npm run test:bot`, then read `bot/test-results.md` and grade each answer.
