// Front end: sidebar navigation, content pages and the chat.
// Pages come from content.json, which "npm run build" generates from content/*.md.

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

// Sidebar order. A section appears only if it has at least one published page.
const SECTIONS = [
  ['about', 'About'],
  ['work', 'Work'],
  ['school', 'School'],
  ['projects', 'Projects'],
  ['interests', 'Interests'],
  ['contact', 'Contact'],
];

const $ = (id) => document.getElementById(id);
const history = []; // the conversation, kept in memory only
let pages = [];
let busy = false;

function buildNav() {
  const nav = $('nav');
  const add = (label, href, external) => {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = href;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `${label} ↗`;
    }
    nav.appendChild(a);
  };
  add('Ask the assistant', '#/');
  for (const [section, label] of SECTIONS) {
    if (pages.some((p) => p.section === section)) add(label, `#/${section}`);
  }
  for (const [label, url] of Object.entries(LINKS)) {
    if (url) add(label, url, true);
  }
}

function route() {
  const section = location.hash.replace(/^#\/?/, '');
  const sectionPages = pages.filter((p) => p.section === section);
  const showPage = sectionPages.length > 0;
  $('chat-view').hidden = showPage;
  $('page-view').hidden = !showPage;
  if (showPage) {
    // This HTML is generated at build time from your own content files.
    $('page-view').innerHTML = sectionPages.map((p) => p.html).join('\n');
    $('page-view').scrollTop = 0;
  }
  const current = showPage ? `#/${section}` : '#/';
  for (const a of $('nav').querySelectorAll('a')) {
    if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function addMessage(role, text, extraClass) {
  $('welcome').hidden = true;
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

async function start() {
  try {
    pages = (await (await fetch('/content.json')).json()).pages;
  } catch {
    pages = [];
  }
  buildNav();
  setUpChat();
  window.addEventListener('hashchange', route);
  route();
}

start();
