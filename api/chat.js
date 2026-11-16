// The chat backend. It runs on the server (a Vercel function), so the API key
// never reaches the visitor's browser.
// The browser sends the conversation; this adds the rules and the public
// knowledge base, calls the Claude API, and returns the reply.

import { RULES, KNOWLEDGE } from '../lib/knowledge.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const MAX_TURNS = 12; // messages kept from the conversation
const MAX_CHARS = 1000; // per visitor message
const MAX_REPLY_TOKENS = 700;
const RATE_LIMIT = 10; // requests per window, per visitor
const RATE_WINDOW_MS = 5 * 60 * 1000;

// Basic per-visitor limit. It resets when the function restarts, so also set
// a monthly spend limit on the API key itself (see README).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const messages = [];
  for (const m of input.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
    if (typeof m.content !== 'string' || !m.content.trim()) return null;
    if (m.role === 'user' && m.content.length > MAX_CHARS) return null;
    messages.push({ role: m.role, content: m.content.slice(0, 4000) });
  }
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'The chat is not set up yet (no API key on the server).' });
  }
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many questions in a short time. Please try again in a few minutes.' });
  }
  const messages = cleanMessages(req.body && req.body.messages);
  if (!messages) {
    return res.status(400).json({ error: `Please send a question of at most ${MAX_CHARS} characters.` });
  }

  const today = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_REPLY_TOKENS,
        system: [
          // The rules and knowledge base do not change between requests, so they are cached.
          { type: 'text', text: `${RULES}\n\nKNOWLEDGE BASE\n\n${KNOWLEDGE}`, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `Today's date is ${today}.` },
        ],
        messages,
      }),
    });
    if (!response.ok) {
      console.error('Claude API error', response.status, await response.text());
      return res.status(502).json({ error: 'The assistant is unavailable right now. Please try again later.' });
    }
    const data = await response.json();
    const reply = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return res.status(200).json({ reply: reply || 'Please follow up with Cole directly for that information.' });
  } catch (error) {
    console.error('Chat request failed', error);
    return res.status(502).json({ error: 'The assistant is unavailable right now. Please try again later.' });
  }
}
