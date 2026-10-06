// Function: choose the author when creating an issue (permission set_original_issue_author).
import { e2e } from '../../.codex/e2e/lib.mjs';

const P = 'e2e-project';
const t = await e2e('set-original-issue-author');

await t.login('manager');
await t.go(`/projects/${P}/issues/new`);
if (!(await t.page.locator('#issue_author_id').count())) t.problems.push('manager: no author field in the new form');
await t.page.fill('#issue_subject', `Original author ${Date.now()}`);
await t.page.locator('#issue_author_id').selectOption({ label: 'Reporter E2E' });
await t.shot('new-form', 'New issue form with the author select, Reporter E2E chosen');
await t.page.click('#issue-form input[name=commit]');
await t.settle();
t.check('create');
const shown = await t.page.locator('.issue .author').first().innerText();
if (!/Reporter E2E/.test(shown)) t.problems.push(`author after create: ${shown}`);
await t.shot('created', 'The issue is created with Reporter E2E as author, not the creating manager');

// the field survives a tracker change (form reload)
await t.go(`/projects/${P}/issues/new`);
const trackers = await t.page.locator('#issue_tracker_id option').count();
if (trackers > 1) {
  await t.page.locator('#issue_tracker_id').selectOption({ index: 1 });
  await t.settle();
  if (await t.page.locator('#issue_author_id').count() !== 1) t.problems.push('author field missing or duplicated after tracker change');
  await t.shot('tracker-change', 'After a tracker change the form reloads and still shows exactly one author field');
}

await t.login('reporter');
await t.go(`/projects/${P}/issues/new`);
if (await t.page.locator('#issue_author_id').count()) t.problems.push('reporter sees the author field');
await t.shot('no-permission', 'Without set_original_issue_author the new form has no author field');
await t.page.evaluate(() => {
  const i = document.createElement('input');
  i.type = 'hidden'; i.name = 'issue[author_id]'; i.value = '1';
  document.querySelector('#issue-form').appendChild(i);
});
await t.page.fill('#issue_subject', `Forged author ${Date.now()}`);
await t.page.click('#issue-form input[name=commit]');
await t.settle();
const a = await t.page.locator('.issue .author').first().innerText();
if (!/Reporter E2E/.test(a)) t.problems.push(`forged author_id on create was honoured: ${a}`);
await t.shot('forged-ignored', 'A forged author_id on create is ignored, the reporter stays author');

await t.done();
