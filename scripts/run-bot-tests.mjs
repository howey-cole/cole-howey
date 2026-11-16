// Sends every question in bot/test-questions.json to the chatbot and writes the
// answers next to the expected behavior, for you to grade by reading.
// Run with: npm run test:bot   (needs ANTHROPIC_API_KEY in .env.local)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

await import('./build-content.mjs');
const { default: chat } = await import('../api/chat.js');
const tests = JSON.parse(readFileSync(join(root, 'bot', 'test-questions.json'), 'utf8'));

function ask(question, i) {
  return new Promise((resolve) => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': `test-${i}` }, // one "visitor" per question, so the rate limit does not trip
      body: { messages: [{ role: 'user', content: question }] },
    };
    const res = {
      status() {
        return this;
      },
      json(data) {
        resolve(data.reply || `ERROR: ${data.error}`);
      },
    };
    chat(req, res);
  });
}

let report = `# Bot test run, ${new Date().toISOString().slice(0, 10)}\n\nGrade each answer against "Expected": pass or fail.\n`;
for (const [i, test] of tests.entries()) {
  const answer = await ask(test.question, i);
  console.log(`${test.id}: done`);
  report += `\n## ${test.id} (${test.type})\n\n**Question:** ${test.question}\n\n**Expected:** ${test.expect}\n\n**Answer:** ${answer}\n\n**Grade:** \n`;
}
writeFileSync(join(root, 'bot', 'test-results.md'), report);
console.log('Wrote bot/test-results.md');
