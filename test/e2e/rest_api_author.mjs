// Function: author_id through the REST API follows the same permissions (safe_attributes).
import { e2e } from '../../.codex/e2e/lib.mjs';

const t = await e2e('rest-api-author');
await t.login('admin');
const auth = u => ({ Authorization: 'Basic ' + Buffer.from(`${u}:Redmine7Test!`).toString('base64'), 'Content-Type': 'application/json' });
const ctx = t.page.context().request;
const authorOf = async id => (await (await ctx.get(`${t.BASE}/issues/${id}.json`, { headers: auth('admin') })).json()).issue.author.name;

const log = [];
async function call(label, method, url, user, data, expect) {
  const r = await ctx[method](t.BASE + url, { headers: auth(user), data: data && JSON.stringify(data) });
  log.push(`${label}: ${method.toUpperCase()} ${url} as ${user} -> HTTP ${r.status()}`);
  if (r.status() !== expect) t.problems.push(`${label}: HTTP ${r.status()}, expected ${expect}`);
  return r;
}

// manager (has the permissions): create with author, then change it
let r = await call('create with author', 'post', '/issues.json', 'manager',
  { issue: { project_id: 'e2e-project', subject: `API author ${Date.now()}`, author_id: 6 } }, 201);
const id = (await r.json()).issue.id;
if (await authorOf(id) !== 'Reporter E2E') t.problems.push('create: author_id not honoured for manager');
await call('change author', 'put', `/issues/${id}.json`, 'manager', { issue: { author_id: 1 } }, 204);
if (await authorOf(id) !== 'Redmine Admin') t.problems.push('update: author_id not honoured for manager');

// editor (no plugin permissions): author_id silently ignored, as any unsafe attribute
r = await call('create as editor', 'post', '/issues.json', 'editor',
  { issue: { project_id: 'e2e-project', subject: `API editor ${Date.now()}`, author_id: 1 } }, 201);
const id2 = (await r.json()).issue.id;
if (await authorOf(id2) !== 'Editor E2E') t.problems.push('create: editor forged the author');
await call('update as editor', 'put', `/issues/${id2}.json`, 'editor', { issue: { author_id: 1 } }, 204);
if (await authorOf(id2) !== 'Editor E2E') t.problems.push('update: editor forged the author');

// the webhook payload (issues/show.api.rsb) carries the same author
const j = await (await ctx.get(`${t.BASE}/issues/${id}.json`, { headers: auth('admin') })).json();
log.push(`issue JSON author after change: ${JSON.stringify(j.issue.author)}`);

await t.page.goto(t.BASE + '/issues/' + id);
await t.settle();
await t.shot('result', `API calls: ${log.join(' | ')}`);
await t.done();
