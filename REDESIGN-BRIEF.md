# Redesign brief (decided 11/15/2026, revised the same evening)

Read `CLAUDE.md` first. Its content rules still apply to everything below. This brief changes structure, layout, labels and styling only. Do not change any facts in `content/`.

## Decisions

### Structure: one page made of bands
- The whole site is a single scrolling page. Each section is a full-width horizontal band, stacked in the order of the menu.
- The menu does not load separate pages. Clicking a menu item scrolls to that band (anchor links such as `#about`, with smooth scrolling). The menu highlights the band currently in view.
- The first band is the chat (see "Chat band"). The other bands follow.
- Only sections with at least one `status: published` page get a band and a menu item. Keep that behavior.
- A direct link such as `/#education` must land on the right band.

### Header
- Name: **Cole Howey**
- Line under the name: `Analytics & Decision Science · MBA, Carnegie Mellon · MS Applied Data Science candidate, UChicago`
- The word "candidate" must stay. The MS is in progress (expected March 2028) and must never be shown as a completed degree.

### Navigation
- The menu sits on the left. A hamburger button at the top left opens and closes it.
- Wide screens (about 1000px and up): the menu is open by default and stays in place while the page scrolls. The hamburger can close it.
- Narrow screens and phones: the menu is closed by default, opens over the page, and closes after a menu item is chosen.
- Menu items, in this order:
  1. About
  2. Professional Experience (the existing `work` section, relabeled; includes the Air Force and Lockheed Martin entries)
  3. Education (the existing `school` section, relabeled)
  4. Projects (hidden for now, see below)
  5. Interests (hidden until Cole writes it, see below)
  6. Contact
- The name in the header links back to the chat band at the top.

### Chat band (top of the page)
- Only the header, the question box and its supporting text. No welcome paragraph.
- Under the box: three or four small, low-emphasis suggested questions. Clicking one asks it.
- One small line stating that answers come from an AI assistant and can contain errors.
- After the first question, the conversation appears above the box inside this band. The band grows to fit, with a sensible maximum height and its own scroll, so a long conversation does not push the other bands far down the page.

### About band layout
- Wide screens: two columns.
  - Left column: the paragraphs that describe Cole's experience (the opening of `content/about.md`).
  - Right column: "Background in brief" and "Education".
  - Below both, spanning the full width: "Skills".
- Narrow screens: one column, in the order paragraphs, background, education, skills.
- Build this from the existing headings in `content/about.md`. Do not rewrite the text. "Based in" can sit at the end of the right column.

### Visual direction
- Modern and restrained: generous white space, clear type hierarchy, few colors, no decoration.
- Light, silver-toned palette, in the range of a silver aluminum laptop: an off-white or light silver-grey page background (around `#f5f5f7` to `#e8e8ea`), near-black text, one muted accent color for links and the send button.
- Adjacent bands alternate between two close background tones (for example white and light silver) so each band reads as its own block.
- The reference Cole likes for overall feel is tigoponcedeleon.com. Use it for the general impression only (clean, light, modern). Do not copy its layout, text, images or code.
- Light theme only for now. Remove the automatic dark mode so the silver palette is what every visitor sees.

### One responsive site
- One page that adapts to phone, tablet and desktop with CSS. Do not build separate mobile and desktop versions.
- Check the layout at 375px, 768px and 1440px wide.

### Font
- Segoe UI through a system font stack: `"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`.
- Do not download, host or embed Segoe UI font files. Visitors on Apple and Android devices will see their own system font; that is accepted.
- Use this one family for headings and body text (replace the current serif headings).

### Education content
- `content/school/01-uchicago-msads.md` already lists every core course, the capstone and the four electives by quarter. Show all of it in the Education band.
- The four electives are confirmed: Causal Models for Data Science; Bayesian Machine Learning with GenAI Applications; Machine Learning Operations; Applied Gen AI: Agents & Multimodal Intelligence.

### Projects
- Set `content/projects/01-projects.md` to `status: draft` so the band and menu item are hidden.
- Each finished project later gets its own file in `content/projects/` with a short write-up and a link to its GitHub repository. Do not build an automatic feed from GitHub.
- For a private repository, the entry says "Code available on request" and has no link.
- The `LINKS.GitHub` value in `public/app.js` stays empty until Cole provides his profile URL.

### Interests
- A separate band and menu item. `content/interests.md` stays `status: draft` until Cole writes the text himself. Do not write interests for him.

### Contact
- Two methods: LinkedIn and email.
- Add both to `content/contact.md` once Cole provides them. Until then, leave the existing TODO comment. Do not guess a URL or an address.

### Employer logos
- Each entry in Professional Experience can show the employer's logo beside the employer name.
- Add an optional `logo:` field to the page frontmatter, holding a file name in `public/logos/`. The build script passes it through to `content.json`; the entry shows it at a fixed height (about 28–32px) with the employer name as alt text.
- If the field is absent or the file is missing, show the name alone. The page must not break.
- Cole supplies the image files. Do not download logos, redraw them or generate them. Show them unmodified: no recoloring, cropping or effects.
- The chatbot's knowledge must not include the logo field.

## Not included
- No tone selector, games or animations beyond smooth scrolling.
- No framework and no new dependencies unless Cole agrees first. The site is plain HTML, CSS and JavaScript on purpose.

## Do not touch
- `.env.local`. Never print, copy or commit the API key.
- The chatbot rules in `bot/system-prompt.md` and the facts in `content/`, except the `status` change named above.
- The search-engine block (`public/robots.txt` and the robots tag in `public/index.html`) stays until launch.

## Already approved by Cole
- The Dick's Sporting Goods entry in Professional Experience, as written.
- The elective list above.

## Still open (waiting on Cole)
- LinkedIn URL and the email address to publish.
- Logo image files.
- Interests text.

## Done means
1. `node scripts/build-content.mjs` runs without errors.
2. `node scripts/dev-server.mjs` serves the site, and the chat answers a question.
3. Every menu item scrolls to its band, and the menu behaves as described at 375px, 768px and 1440px.
4. The About band shows two columns with Skills spanning them on wide screens, and one column on phones.
5. `node scripts/run-bot-tests.mjs` runs, and Cole grades `bot/test-results.md`.
6. Cole is shown a short list of what changed, by file.
