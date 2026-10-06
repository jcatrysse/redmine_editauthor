// Function: change the author of several issues at once (bulk edit, edit_issue_author).
import { e2e } from '../../.codex/e2e/lib.mjs';

const P = 'e2e-project';
const t = await e2e('bulk-edit-author');

await t.login('manager');
await t.go(`/issues/bulk_edit?ids[]=2&ids[]=3`);
const sel = t.page.locator('#issue_author_id');
if (!(await sel.count())) t.problems.push('manager: no author field in bulk edit');
const first = await t.page.locator('#issue_author_id option').first().getAttribute('value');
if (first !== '') t.problems.push(`first bulk option has value "${first}", expected the empty "no change" option`);
await t.shot('bulk-form', 'Bulk edit form with the author select, "(No change)" first');
await sel.selectOption({ label: 'Reporter E2E' });
await t.page.click('#bulk_edit_form input[name=commit]');
await t.settle();
t.check('bulk save');
await t.go('/issues/2');
if (!/Reporter E2E/.test(await t.page.locator('.issue .author').first().innerText())) t.problems.push('issue 2 author not changed');
await t.go('/issues/3');
if (!/Reporter E2E/.test(await t.page.locator('.issue .author').first().innerText())) t.problems.push('issue 3 author not changed');
await t.shot('bulk-result', 'Issue 3 after the bulk edit shows the new author');

// "no change" leaves the author alone
await t.go(`/issues/bulk_edit?ids[]=2&ids[]=3`);
await t.page.click('#bulk_edit_form input[name=commit]');
await t.settle();
await t.go('/issues/2');
if (!/Reporter E2E/.test(await t.page.locator('.issue .author').first().innerText())) t.problems.push('"no change" changed the author');

// restore for repeatable runs
await t.go(`/issues/bulk_edit?ids[]=2&ids[]=3`);
await t.page.locator('#issue_author_id').selectOption({ label: 'Redmine Admin' });
await t.page.click('#bulk_edit_form input[name=commit]');
await t.settle();

await t.login('reporter');
// a reporter may not edit these issues in bulk at all (403): the form with the field is out of reach
await t.go(`/issues/bulk_edit?ids[]=2&ids[]=3`, { status: 403 });
if (await t.page.locator('#issue_author_id').count()) t.problems.push('reporter sees the author field in bulk edit');
await t.shot('no-permission', 'Without edit permission bulk edit is refused, no author field reachable');

// an editor without edit_issue_author: no field, and a forged author_id is ignored
await t.login('editor');
await t.go(`/issues/bulk_edit?ids[]=2&ids[]=3`);
if (await t.page.locator('#issue_author_id').count()) t.problems.push('editor sees the author field in bulk edit');
await t.shot('editor-no-permission', 'An editor without edit_issue_author: bulk edit works but has no author field');
await t.page.evaluate(() => {
  const i = document.createElement('input');
  i.type = 'hidden'; i.name = 'issue[author_id]'; i.value = '6';
  document.querySelector('#bulk_edit_form').appendChild(i);
});
await t.page.click('#bulk_edit_form input[name=commit]');
await t.settle();
await t.go('/issues/2');
const au = await t.page.locator('.issue .author').first().innerText();
if (!/Redmine Admin/.test(au)) t.problems.push(`forged bulk author_id was honoured: ${au}`);
await t.shot('editor-forged-ignored', 'A forged bulk author_id from an editor without the permission is ignored');

await t.done();
