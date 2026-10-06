// Function: change the author of an existing issue (permission edit_issue_author),
// shown in the history; refusal without the permission, also for a forged request.
import { e2e } from '../../.codex/e2e/lib.mjs';

const P = 'e2e-project';
const t = await e2e('edit-issue-author');

// manager creates an issue so the scenario does not depend on seed state
await t.login('manager');
await t.go(`/projects/${P}/issues/new`);
await t.page.fill('#issue_subject', `Author edit ${Date.now()}`);
await t.page.click('#issue-form input[name=commit]');
await t.settle();
const issuePath = new URL(t.page.url()).pathname;

await t.go(`${issuePath}/edit`);
const select = t.page.locator('#issue_author_id');
if (!(await select.count())) t.problems.push('manager: no author field in the edit form');
const before = await t.page.locator('#editauthor').evaluate(el => el.nextElementSibling && el.nextElementSibling.querySelector('#issue_tracker_id') ? 'before-tracker' : 'elsewhere');
if (before !== 'before-tracker') t.problems.push(`author field is not placed before the tracker field (${before})`);
await t.shot('edit-form', 'Edit form with the author select above the tracker, for a member with edit_issue_author');
await select.selectOption({ label: 'Reporter E2E' });
await t.page.click('#issue-form input[name=commit]');
await t.settle();
t.check('save author');
const detail = t.page.locator('.journal li', { hasText: 'Author' });
if (!(await detail.count())) t.problems.push('history shows no author change');
else if (!/Manager E2E.*Reporter E2E/.test(await detail.first().innerText())) t.problems.push(`history text: ${await detail.first().innerText()}`);
await t.shot('journal', 'History shows "Author changed from Manager E2E to Reporter E2E" with names, not ids');

// edit again: the select now preselects the new author
await t.go(`${issuePath}/edit`);
const sel = await t.page.locator('#issue_author_id option:checked').innerText();
if (!/Reporter E2E/.test(sel)) t.problems.push(`preselected author is ${sel}`);

// reporter: no field, and a forged author_id is ignored
await t.login('reporter');
await t.go(`${issuePath}/edit`);
if (await t.page.locator('#issue_author_id').count()) t.problems.push('reporter sees the author field');
await t.shot('no-permission', 'Without edit_issue_author the edit form has no author field');
await t.page.evaluate(() => {
  const i = document.createElement('input');
  i.type = 'hidden'; i.name = 'issue[author_id]'; i.value = '1';
  document.querySelector('#issue-form').appendChild(i);
});
await t.page.fill('#issue_notes', 'forged author_id');
await t.page.click('#issue-form input[name=commit]');
await t.settle();
const shown = await t.page.locator('.issue .author').first().innerText();
if (!/Reporter E2E/.test(shown)) t.problems.push(`forged author_id changed the author: ${shown}`);
if (await t.page.locator('.journal li', { hasText: 'Author changed' }).count() > 1) t.problems.push('forged request created a second author change');
await t.shot('forged-ignored', 'A forged issue[author_id] from a user without the permission is ignored, author unchanged');

// outsider: private project stays invisible
await t.login('outsider');
await t.go('/issues/6', { status: 403 });
await t.shot('outsider', 'Outsider gets no access to a private issue');

await t.done();
