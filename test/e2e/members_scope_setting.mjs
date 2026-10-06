// Function: plugin setting "members only" narrows the possible authors.
import { e2e } from '../../.codex/e2e/lib.mjs';

const P = 'e2e-project';
const t = await e2e('members-scope-setting');

async function authors() {
  return await t.page.locator('#issue_author_id option').allInnerTexts();
}
async function setScope(on) {
  await t.go('/settings/plugin/redmine_editauthor');
  const box = t.page.locator('input[type=checkbox][name="settings[members_scope]"]');
  if (on) await box.check(); else await box.uncheck();
  await t.shot(on ? 'setting-on' : 'setting-off', `Plugin settings, members scope ${on ? 'on' : 'off'}`);
  await t.page.click('input[name=commit]');
  await t.settle();
  t.check('save settings');
}

await t.login('admin');
await setScope(false);
await t.login('manager');
await t.go(`/projects/${P}/issues/new`);
const off = await authors();
await t.shot('authors-default', `Possible authors with the default setting: ${off.join(', ')}`);
if (!off.some(a => /Redmine Admin/.test(a))) t.problems.push('default: administrator member should be a possible author');
if (off.some(a => /Viewer E2E/.test(a))) t.problems.push('default: a member who cannot add issues is listed');

await t.login('admin');
await setScope(true);
await t.login('manager');
await t.go(`/projects/${P}/issues/new`);
const on = await authors();
await t.shot('authors-members', `Possible authors with members scope: ${on.join(', ')}`);
if (!on.some(a => /Viewer E2E/.test(a))) t.problems.push('members scope: member without add_issues should be listed');
if (!on.some(a => /Manager E2E/.test(a))) t.problems.push('members scope: manager missing');

await t.login('admin');
await setScope(false);
await t.done();
