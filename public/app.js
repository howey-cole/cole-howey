// Front end: one scrolling page of bands, a top bar and the chat.
// Bands come from content.json, which "npm run build" generates from content/*.md.

// Profile links for the icon buttons in the top bar. Paste each URL between the quotes.
const LINKS = {
  LinkedIn: 'https://www.linkedin.com/in/cole-howey/',
  GitHub: 'https://github.com/howey-cole',
};
// true: a button with an empty URL shows greyed out as a placeholder. false: it is hidden.
const SHOW_PLACEHOLDER_ICONS = false;

// Optional images. Without them the site shows a placeholder block and the drawn background.
const HEADSHOT = '/images/headshot.jpg';
const BACKGROUND_PHOTO = '/images/background.jpg';

const SUGGESTIONS = [
  "What does Cole do in his current role?",
  "What is Cole's experience with A/B testing and causal inference?",
  "How has Cole worked with data engineering on metrics and data models?",
  "What is Cole studying at the University of Chicago?",
];

// Bar and band order: [content section, page anchor, label].
// A band and its link appear only if the section has at least one published page.
const SECTIONS = [
  ['about', 'about', 'About'],
  ['work', 'experience', 'Professional Experience'],
  ['school', 'education', 'Education'],
  ['projects', 'projects', 'Projects'],
  ['interests', 'interests', 'Interests'],
  ['contact', 'contact', 'Contact'],
];

// About band rows: photo and paragraphs; "Background in brief" beside "Education";
// then the headings listed in ABOUT_FULL across the full width.
const ABOUT_LEFT = ['Background in brief'];
const ABOUT_FULL = ['Skills'];

const PHONE = window.matchMedia('(max-width: 759px)');
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

// The headshot, in a grey block of the same size that shows on its own if the file is missing.
function makePhoto() {
  const frame = document.createElement('div');
  frame.className = 'about-photo';
  const img = document.createElement('img');
  img.src = HEADSHOT;
  img.alt = 'Cole Howey';
  img.width = 440;
  img.height = 550;
  img.addEventListener('error', () => img.remove());
  frame.appendChild(img);
  return frame;
}

// Splits the About page at its headings into rows.
function layOutAbout(entry) {
  const box = (name) => {
    const div = document.createElement('div');
    div.className = name;
    return div;
  };
  const grid = box('about-grid');
  const intro = box('about-intro');
  const left = box('about-left');
  const right = box('about-right');
  const full = box('about-full');

  let target = intro;
  for (const node of [...entry.children]) {
    if (node.tagName === 'H3') node.hidden = true; // the name already appears in the name card
    if (node.tagName === 'H4') {
      const name = node.textContent.trim();
      const group = box(`about-group about-${slugify(name)}`);
      (ABOUT_FULL.includes(name) ? full : ABOUT_LEFT.includes(name) ? left : right).appendChild(group);
      target = group;
    }
    target.appendChild(node);
  }
  const top = box('about-row about-row-top');
  top.append(makePhoto(), intro);
  const middle = box('about-row about-row-middle');
  middle.append(left, right);
  grid.append(top, middle, full);
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

/* ---------- Top bar ---------- */

function buildNav() {
  const list = document.createElement('ul');
  for (const [, anchor, label] of SECTIONS) {
    if (!$(anchor)) continue;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${anchor}`;
    a.textContent = label;
    li.appendChild(a);
    list.appendChild(li);
  }
  $('nav').appendChild(list);

  for (const [name, url] of Object.entries(LINKS)) {
    const button = $(`link-${name.toLowerCase()}`);
    if (!button) continue;
    if (url) {
      button.href = url;
      button.hidden = false;
    } else if (SHOW_PLACEHOLDER_ICONS) {
      // No href, so it cannot be clicked or tabbed to; screen readers hear that it is coming.
      button.removeAttribute('target');
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('aria-label', `${name} link coming soon`);
      button.title = `${name} link coming soon`;
      button.hidden = false;
    }
  }
}

function setNavOpen(open) {
  document.body.classList.toggle('nav-open', open);
  $('menu-toggle').setAttribute('aria-expanded', String(open));
}

// On phones the section links fold into the Menu button.
function setUpNav() {
  const isOpen = () => document.body.classList.contains('nav-open');
  $('menu-toggle').addEventListener('click', () => {
    setNavOpen(!isOpen());
    if (isOpen()) $('nav').querySelector('a')?.focus();
  });
  $('nav').addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (isOpen() && !event.target.closest('.topbar')) setNavOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setNavOpen(false);
      $('menu-toggle').focus();
    }
  });
  PHONE.addEventListener('change', () => setNavOpen(false));
}

// Marks the bar link for the band in the middle of the screen.
function trackCurrentBand() {
  const links = [...$('nav').querySelectorAll('a')];
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

// Uses public/images/background.jpg as the page background when that file exists.
function useBackgroundPhotoIfPresent() {
  const probe = new Image();
  probe.addEventListener('load', () => document.documentElement.classList.add('has-photo-bg'));
  probe.src = BACKGROUND_PHOTO;
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
  useBackgroundPhotoIfPresent();
  setUpNav();
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
