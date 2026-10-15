// Function: plugin setting "Possible authors" (three stages) decides who can be chosen as author.
import { e2e } from '../../.codex/e2e/lib.mjs';

const P = 'e2e-project';
const t = await e2e('members-scope-setting');

async function authors() {
  return await t.page.locator('#issue_author_id option').allInnerTexts();
}
async function setScope(value, shot) {
  await t.go('/settings/plugin/redmine_editauthor');
  await t.page.locator('#settings_authors_scope').selectOption(value);
  await t.shot(shot, `Plugin settings, possible authors: ${value}`);
  await t.page.click('input[name=commit]');
  await t.settle();
  t.check('save settings');
}
async function listAs(shot, caption) {
  await t.login('manager');
  await t.go(`/projects/${P}/issues/new`);
  const list = await authors();
  await t.shot(shot, `${caption}: ${list.join(', ')}`);
  return list;
}
const has = (list, name) => list.some(a => a.includes(name));

await t.login('admin');
await t.go('/settings/plugin/redmine_editauthor');
const initial = await t.page.locator('#settings_authors_scope').inputValue();
await t.shot('setting-default', `Plugin settings as shipped, selected: ${initial}`);
if (initial !== 'project_add_issues') t.problems.push(`default setting is ${initial}`);

await setScope('project_add_issues', 'setting-project-add-issues');
let l = await listAs('authors-project-add-issues', 'Project members who may add issues');
if (!has(l, 'Manager E2E') || !has(l, 'Reporter E2E')) t.problems.push('stage 1: project members missing');
if (has(l, 'Viewer E2E')) t.problems.push('stage 1: member without add_issues listed');
if (has(l, 'Elsewhere E2E')) t.problems.push('stage 1: user from another project listed');

await t.login('admin');
await setScope('any_role', 'setting-any-role');
l = await listAs('authors-any-role', 'Anyone with such a role in any project');
if (!has(l, 'Elsewhere E2E')) t.problems.push('stage 2: user with the role elsewhere missing');
if (has(l, 'Viewer E2E')) t.problems.push('stage 2: member without add_issues listed');

await t.login('admin');
await setScope('project_members', 'setting-project-members');
l = await listAs('authors-project-members', 'All project members');
if (!has(l, 'Viewer E2E')) t.problems.push('stage 3: member without add_issues missing');
if (has(l, 'Elsewhere E2E')) t.problems.push('stage 3: user from another project listed');

// a user without the permission never sees the field, whatever the setting
await t.login('reporter');
await t.go(`/projects/${P}/issues/new`);
if (await t.page.locator('#issue_author_id').count()) t.problems.push('reporter sees the author field');
await t.shot('no-permission', 'Without the plugin permission there is no author field in any stage');

await t.login('outsider');
await t.go('/settings/plugin/redmine_editauthor', { status: 403 });
await t.shot('settings-refused', 'The setting page is for administrators only');

await t.login('admin');
await setScope('project_add_issues', 'setting-restored');
await t.done();
