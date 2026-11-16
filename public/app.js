// Front end: one scrolling page of bands, a left menu and the chat.
// Bands come from content.json, which "npm run build" generates from content/*.md.

// Add your links here. A link is hidden while its value is empty.
const LINKS = {
  GitHub: '',
  LinkedIn: '',
};

const SUGGESTIONS = [
  "What does Cole do in his current role?",
  "What is Cole's experience with A/B testing and causal inference?",
  "How has Cole worked with data engineering on metrics and data models?",
  "What is Cole studying at the University of Chicago?",
];

// Menu and band order: [content section, page anchor, label].
// A band appears only if its section has at least one published page.
const SECTIONS = [
  ['about', 'about', 'About'],
  ['work', 'experience', 'Professional Experience'],
  ['school', 'education', 'Education'],
  ['projects', 'projects', 'Projects'],
  ['interests', 'interests', 'Interests'],
  ['contact', 'contact', 'Contact'],
];

// About band: headings listed here span the full width; the others
// ("Background in brief", "Education", "Based in") form the right-hand column.
const ABOUT_FULL = ['Skills'];

const WIDE = window.matchMedia('(min-width: 1000px)');
const $ = (id) => document.getElementById(id);
const history = []; // the conversation, kept in memory only
let pages = [];
let busy = false;

/* ---------- Bands ---------- */

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Shows the employer logo beside the entry's first heading, if the page names one.
function addLogo(entry, logo) {
  const heading = entry.querySelector('h3');
  if (!logo || !heading) return;
  const head = document.createElement('div');
  head.className = 'entry-head';
  const img = document.createElement('img');
  img.className = 'logo';
  img.src = `/logos/${encodeURIComponent(logo)}`;
  img.alt = heading.textContent;
  img.addEventListener('error', () => img.remove()); // missing file: show the name alone
  heading.replaceWith(head);
  head.append(img, heading);
}

// Splits the About page at its headings into the two-column layout.
function layOutAbout(entry) {
  const grid = document.createElement('div');
  grid.className = 'about-grid';
  const intro = document.createElement('div');
  intro.className = 'about-intro';
  const side = document.createElement('div');
  side.className = 'about-side';
  const full = document.createElement('div');
  full.className = 'about-full';

  let target = intro;
  for (const node of [...entry.children]) {
    if (node.tagName === 'H3') {
      node.hidden = true; // the name already appears in the site header
    }
    if (node.tagName === 'H4') {
      const group = document.createElement('div');
      group.className = `about-group about-${slugify(node.textContent)}`;
      const name = node.textContent.trim();
      (ABOUT_FULL.includes(name) ? full : side).appendChild(group);
      target = group;
    }
    target.appendChild(node);
  }
  grid.append(intro, side, full);
  entry.replaceChildren(grid);
}

function buildBands() {
  const container = $('bands');
  for (const [section, anchor, label] of SECTIONS) {
    const sectionPages = pages.filter((p) => p.section === section);
    if (!sectionPages.length) continue;

    const band = document.createElement('section');
    band.id = anchor;
    band.className = `band band-${anchor}`;
    band.setAttribute('aria-labelledby', `${anchor}-title`);
    const inner = document.createElement('div');
    inner.className = 'band-inner';
    const title = document.createElement('h2');
    title.id = `${anchor}-title`;
    title.className = 'band-title';
    title.textContent = label;
    inner.appendChild(title);

    for (const page of sectionPages) {
      const entry = document.createElement('article');
      entry.className = 'entry';
      // This HTML is generated at build time from your own content files.
      entry.innerHTML = page.html;
      const first = entry.querySelector('h3');
      if (first && first.textContent.trim() === label) first.hidden = true; // e.g. "Contact" under "Contact"
      if (section === 'about') layOutAbout(entry);
      addLogo(entry, page.logo);
      inner.appendChild(entry);
    }
    band.appendChild(inner);
    container.appendChild(band);
  }
}

/* ---------- Menu ---------- */

function buildNav() {
  const nav = $('nav');
  const list = document.createElement('ul');
  const add = (label, href, external) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = external ? `${label} ↗` : label;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener';
      li.className = 'external';
    }
    li.appendChild(a);
    list.appendChild(li);
  };
  for (const [, anchor, label] of SECTIONS) {
    if ($(anchor)) add(label, `#${anchor}`);
  }
  for (const [label, url] of Object.entries(LINKS)) {
    if (url) add(label, url, true);
  }
  nav.appendChild(list);
}

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  $('menu-toggle').setAttribute('aria-expanded', String(open));
  $('menu').inert = !open;
  $('backdrop').hidden = !open || WIDE.matches;
}

function setUpMenu() {
  setMenu(WIDE.matches);
  WIDE.addEventListener('change', () => setMenu(WIDE.matches));
  $('menu-toggle').addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    setMenu(open);
    if (open && !WIDE.matches) $('nav').querySelector('a')?.focus();
  });
  $('backdrop').addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !WIDE.matches && document.body.classList.contains('menu-open')) {
      setMenu(false);
      $('menu-toggle').focus();
    }
  });
  $('nav').addEventListener('click', (event) => {
    if (event.target.closest('a') && !WIDE.matches) setMenu(false);
  });
}

// Highlights the menu item for the band in the middle of the screen.
function trackCurrentBand() {
  const links = [...$('nav').querySelectorAll('a[href^="#"]')];
  const mark = (id) => {
    for (const a of links) {
      if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };
  const bands = [...document.querySelectorAll('.band')];
  const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const observer = new IntersectionObserver(
    (entries) => {
      if (atBottom()) return;
      for (const entry of entries) if (entry.isIntersecting) mark(entry.target.id);
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  for (const band of bands) observer.observe(band);
  // A short last band (Contact) never reaches the middle of the screen; mark it at the bottom.
  window.addEventListener('scroll', () => {
    if (atBottom()) mark(bands[bands.length - 1].id);
  }, { passive: true });
}

// Old links such as #/work still land on the right band.
function redirectOldLinks() {
  const match = location.hash.match(/^#\/(.*)$/);
  if (!match) return;
  const found = SECTIONS.find(([section]) => section === match[1]);
  window.history.replaceState(null, '', found ? `#${found[1]}` : '#top');
}

function scrollToHash(behavior = 'smooth') {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) document.getElementById(id)?.scrollIntoView({ behavior });
}

/* ---------- Chat ---------- */

function addMessage(role, text, extraClass) {
  $('thread').hidden = false;
  const div = document.createElement('div');
  div.className = `message ${role}${extraClass ? ` ${extraClass}` : ''}`;
  div.textContent = text; // textContent, so replies can never inject HTML
  $('thread').appendChild(div);
  $('thread').scrollTop = $('thread').scrollHeight;
  return div;
}

async function ask(question) {
  question = question.trim();
  if (!question || busy) return;
  busy = true;
  $('send').disabled = true;
  addMessage('user', question);
  history.push({ role: 'user', content: question });
  const pending = addMessage('assistant', 'Thinking…', 'pending');
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    pending.className = 'message assistant';
    pending.textContent = data.reply;
    history.push({ role: 'assistant', content: data.reply });
  } catch (error) {
    history.pop(); // drop the unanswered question so the conversation stays valid
    pending.className = 'message assistant error';
    pending.textContent = error.message || 'Something went wrong. Please try again.';
  } finally {
    busy = false;
    $('send').disabled = false;
    $('thread').scrollTop = $('thread').scrollHeight;
  }
}

function setUpChat() {
  for (const text of SUGGESTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', () => ask(text));
    $('suggestions').appendChild(button);
  }
  const box = $('question');
  $('composer').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = box.value;
    box.value = '';
    box.style.height = 'auto';
    ask(text);
  });
  box.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      $('composer').requestSubmit();
    }
  });
  box.addEventListener('input', () => {
    box.style.height = 'auto';
    box.style.height = `${box.scrollHeight}px`;
  });
}

/* ---------- Start ---------- */

async function start() {
  redirectOldLinks();
  setUpMenu();
  setUpChat();
  try {
    pages = (await (await fetch('/content.json')).json()).pages;
  } catch {
    pages = [];
  }
  buildBands();
  buildNav();
  // The bands did not exist when the browser first looked for the anchor, so jump there now.
  scrollToHash('instant');
  trackCurrentBand();
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/')) {
      redirectOldLinks();
      scrollToHash();
    }
  });
}

start();
