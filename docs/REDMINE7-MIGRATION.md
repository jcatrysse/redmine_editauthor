# Redmine 7 migration: redmine_editauthor

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. That includes the plugin's tests on
> PostgreSQL and MariaDB, every function exercised end to end on a real running Redmine in a
> browser (with and without permissions, failure paths included) with screenshots you looked at,
> and an OpenAI review of the diff when OPENAI_API_KEY is set. Report to me in Dutch at the end.

This file is the plan and the memory of that work. Update it as you go: verdicts, results,
what is left. Written 2026-10-06 from a measured analysis (report at the bottom).

## Status

| | |
|---|---|
| Plugin id | `redmine_editauthor` |
| GEOxyz runs today | `master` |
| Upstream | nounder/redmine_editauthor master @ db98ca9 (2022-10-12) |
| Runs on Redmine 7 as is | YES (tests fixed in d177c48) |
| Upstream sync | UPSTREAM DOOD |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 1 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz + latest 7.0-stable), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16 and MariaDB 10.11 |
| Branch head when this file was written | `5f7c2dd` |

## Already on this branch

- `d177c48` Use keyword params in functional tests
- Tests and end-to-end scenarios for every function (see "Results" below); no plugin code change was needed.

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Open items from the analysis** (Dutch; where they conflict with a decision or a priority item above, those win)

1. None for the migration; note that redmine_inline_edit_issues bypasses this plugin's edit_issue_author check (mass assignment)

**Checks**

2. Run the plugin's whole test suite on Redmine 7.0-stable-GEOxyz with PostgreSQL AND MariaDB, and once on 5.1-stable if the branch is meant to stay 5.1-compatible.
3. Check Redmine 7 webhooks against this plugin (see "Rules"), and note the result here even if nothing is needed.
4. Verify every feature of the plugin by hand on a running Redmine 7 (screenshots).

## Results (Redmine 7.0.1, 7.0-stable-GEOxyz, Ruby 3.3.6, 2026-10-06)

| | PostgreSQL 16.15 | MariaDB 10.11.14 |
|---|---|---|
| Baseline minitest (before) | 5 runs, 8 assertions, 0 failures | not run |
| minitest after (13 tests) | 13 runs, 28 assertions, 0 failures, 0 errors, 0 skips | 13 runs, 28 assertions, 0 failures, 0 errors, 0 skips |
| e2e smoke + core | smoke 11 shots, core 6 shots, 0 problems | same, 0 problems |
| e2e plugin scenarios (5) | 0 problems | 0 problems |

Production-mode server on both databases. No migrations in this plugin (nothing to roll back). 5.1-stable was not run: no code changed, and the tests use syntax that Redmine 5.1 also accepts. Run together with other GEOxyz plugins: not done in this session (no other plugin available here); the plugin only adds `safe_attributes` and view hooks.

**Webhooks (Redmine 7)**: the plugin hides nothing and adds no issue data. The author is part of core `issues/show.api.rsb` and follows the real `author_id`; changes via the plugin are normal journal changes. Verified through `/issues/:id.json` (`rest_api_author` scenario). Nothing needed.

**Findings, not fixed (minimal diff rule)**
- A non-member administrator is NOT listed as possible author in the default mode: `possible_authors` does an inner join on members, but the README and the settings text say administrators are listed. Only administrators that are project members are. Behaviour unchanged since upstream; see Open questions.
- `it.yml` and `pl.yml` lack the two settings keys (`label_editauthor_members_scope`, `text_editauthor_members_scope`); Redmine falls back to English on the settings page. Old gap, not fixed: the keys cannot be translated by matching existing keys in those files.
- `redmine_inline_edit_issues` bypasses the `edit_issue_author` check (mass assignment), as in the analysis.
- The author field is moved into place by an inline `<script>` with jQuery; it works on Redmine 7 (checked after a tracker change as well).

**OpenAI review** (gpt-5, `docs/reviews/`): 9 findings, 1 test fixed, 1 assertion made locale independent, 4 rejected as wrong (the `setup` block grants the permission, transactions roll back), 3 kept with reasons. A review re-run after the fixes is not done. The shared workflow uploads `redmine/log/*.log` as an artifact on e2e runs (not this plugin's change); consider the log content before using it on a repository with wider read access.

## Function inventory

| function | how a user reaches it | scenario | screenshots |
|---|---|---|---|
| change author of an issue (`edit_issue_author`), journal shows names | issue edit form | `test/e2e/edit_issue_author.mjs` | `docs/e2e/edit-issue-author-*.png` (edit form, journal, no permission, forged request ignored, outsider refused) |
| set author on creation (`set_original_issue_author`) | new issue form, also after tracker change | `test/e2e/set_original_issue_author.mjs` | `docs/e2e/set-original-issue-author-*.png` |
| change author in bulk | issue list, bulk edit | `test/e2e/bulk_edit_author.mjs` | `docs/e2e/bulk-edit-author-*.png` (reporter refused 403, editor without permission has no field, forged ignored) |
| setting "members only" | Administration > Plugins > configure | `test/e2e/members_scope_setting.mjs` | `docs/e2e/members-scope-setting-*.png` |
| REST API `author_id` | `POST/PUT /issues.json` | `test/e2e/rest_api_author.mjs` | `docs/e2e/rest-api-author-result.png` |
| permissions, project module | Roles and permissions | covered by the scenarios above (manager, reporter, editor, outsider) | |

No routes, rake tasks, macros, mail handling or cron in this plugin.

## Decided by Jan (2026-10-07)

Full text in `docs/DECISIONS-2026-10-07.md`.

1. **editauthor-q1, non-member administrators as author**: Jan chose A, "Zo laten (gebouwd)" (nothing changes for users; README and settings text do not match what the plugin does). Kept as built, no code change. Jan's note: none.
2. **No backports, Redmine 7 only**: GEOxyz goes straight to Redmine 7; 5.1 compatibility is no longer a requirement.
3. **PostgreSQL 16 only**: tests and e2e on PostgreSQL; MariaDB runs are no longer required (the MariaDB results above stay as extra information).
4. **deface**: not used by this plugin, no Gemfile, nothing to change.
5. **`prepend` instead of `alias_method`**: checked, this plugin has no `alias_method` and patches only `Issue` through `safe_attributes` (an `include`, not a method override), so nothing to switch. The run with the other GEOxyz plugins (`RMP_EXTRA_PLUGINS`, Project > Settings, issue list, issue page) was not done here: their repositories are not known in this session. Left for the coordinating harness.
6. **GitHub Actions**: stay manual only.

## GEOxyz changes to review or re-apply

These GEOxyz commits are on the branch GEOxyz runs today and therefore on this branch. Review each one against the code it now sits on (upstream merges and Redmine 7 core): drop it if upstream or core now does the same, rewrite it if it is not up to the quality rules below (tests, I18n, security, portability), keep it otherwise. Record the verdict per commit in this file.

| commit | date | subject |
|---|---|---|
| `6b22e8f` | 2025-04-26 | Add NL locale |

Verdict `6b22e8f`: keep. `config/locales/nl.yml` has the same keys as `en.yml` (checked below), core has no overlap.

## After the upgrade (production)

Actions the person doing the upgrade must take, or know about, for this plugin:

- None known. Add here what the session finds.

## How to test

```sh
./.codex/redmine_clone.sh 7.0-stable-GEOxyz      # or 5.1-stable / 6.1-stable / 7.0-stable
./.codex/test_setup.sh                                 # RMP_DB=mariadb for MariaDB, RMP_PROVISION_DB=0 if a server runs
./.codex/test_plugin.sh                                # minitest + rspec of this plugin
```

```sh
./.codex/start_server.sh       # real Redmine (production mode) with this plugin, seeded users and projects
./.codex/e2e.sh                # browser: smoke over the plugin's pages, core issue flows, test/e2e/*.mjs
./.codex/openai_review.sh      # independent OpenAI review of the diff, only when OPENAI_API_KEY is set
```
Write one scenario per function in `test/e2e/<function>.mjs` (example at the top of
`.codex/e2e/lib.mjs`); screenshots and a table per scenario land in `docs/e2e/`. Users:
`admin`, `manager` (every permission), `reporter` (no plugin permissions), `outsider` (no
membership); password `Redmine7Test!`. Needs Node with Playwright and Chromium
(`npm install -g playwright && npx playwright install --with-deps chromium`).

On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow (tick
"e2e" for the browser run; screenshots come back as an artifact).

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline, before you change anything**:
   - the plugin's tests on Redmine 7.0-stable-GEOxyz with PostgreSQL and with MariaDB;
   - a real running Redmine with this plugin (`./.codex/start_server.sh`) and the browser run
     (`./.codex/e2e.sh`: smoke over every page the plugin adds, plus the core issue flows).
   Write the numbers here. Something already broken now is a finding, not your regression.
3. **Inventory of functions**: list every function of the plugin in this file, in a table
   "function | how a user reaches it | scenario | screenshot". Take them from the README,
   `init.rb` (permissions, menus, settings, project modules), routes, hooks and view
   overrides, macros, mail handling, API endpoints, rake tasks and cron jobs. This table is the
   coverage list for step 8; a function that is not in it will not be tested.
4. **GEOxyz changes**: go through the table above, one item at a time. Each kept or re-made change
   is its own commit with a test that proves it. Record the verdict in the table.
5. **Work list**: then the numbered list, in order. One concern per commit.
6. **Portability**: everything must run on Redmine's supported databases (PostgreSQL,
   MySQL/MariaDB; SQLite where the plugin already supports it). Migrations must be reversible and
   are run down and up on PostgreSQL and MariaDB.
7. **Together**: run with the other GEOxyz plugins installed (the migration kit's harness, or
   `RMP_EXTRA_PLUGINS`). A failure that only appears in combination is a finding to record here.
8. **End to end, visually, every function**: on the real Redmine from `start_server.sh`
   (production mode, the way GEOxyz runs it), write one scenario per function in
   `test/e2e/<function>.mjs` with `.codex/e2e/lib.mjs` and run them with `./.codex/e2e.sh`.
   - Each function as the users that matter: `admin`, `manager` (every permission, the
     plugin's included), `reporter` (member without the plugin's permissions), `outsider`
     (no membership, private project must stay invisible).
   - The failure paths too: setting off, permission absent, empty state, invalid input, the
     value that used to raise. A refusal that is shown is evidence as much as a success.
   - One screenshot per function and per path, with a caption saying what it proves. Open
     every screenshot and look at it: a picture nobody looked at proves nothing. Commit them
     in `docs/e2e/` and list them in the inventory table.
   - Functions without a page (mail in and out, REST API, rake tasks, cron, webhooks): exercise
     them against the same running instance (mails land in `redmine/tmp/mails`, `t.mails()`
     reads them; API through `t.page.request`) and record command and result.
   - Before pictures where behaviour or layout changes: the branch GEOxyz runs today, on
     Redmine 5.1, same scenarios, `RMP_E2E_OUT=docs/e2e/before`.
   - Run the whole e2e set once on MariaDB as well (`RMP_DB=mariadb`, then `start_server.sh --reset`).
9. **Independent review**: first your own, adversarial: re-read the whole diff as if someone
   else wrote it and you are paid to reject it. Then, **when `OPENAI_API_KEY` is set in the
   session**, `./.codex/openai_review.sh`: it sends the diff of this branch to an OpenAI model
   and writes `docs/reviews/openai-<date>-<sha>.md`. Every finding gets a `Resolution:` line
   there (fixed in <commit>, with a test, or why not). Fix, re-run the tests and the e2e set,
   and run the review again until it has nothing new that you accept. Without the key: write
   "OpenAI review: skipped, no OPENAI_API_KEY" in the report; never send code anywhere else.
10. **After the upgrade**: anything the production upgrade must do for this plugin (data fixes,
    settings, cron, files, removed features) goes into the section "After the upgrade".
11. **Finish**: update "Status", the inventory and the work list in this file, push
    `redmine70-migration`, and report: what changed, test numbers on both databases, e2e
    numbers (scenarios, screenshots, problems), the review result, what is left, what needs Jan.

### Stop and ask Jan when
- a GEOxyz change would be lost or behave differently for users;
- a new gem, a new setting with user impact, or a schema change not required by Redmine 7 seems needed;
- the change would send data to an external service (the OpenAI review of the code diff is the
  one exception Jan approved, and only when the key is present);
- upstream and GEOxyz disagree on behaviour and both are defensible.

## Rules

- **Target**: Redmine 7.0-stable-GEOxyz (https://github.com/jcatrysse/redmine), Rails 8.1, Ruby 3.3+.
  Core sources for comparison: branches `5.1-stable`, `6.1-stable`, `7.0-stable`, `7.0-stable-GEOxyz`.
- **Evidence**: never report a test, lint, browser check or review as passed without having seen
  it. Quote the summary lines; list the screenshots. "Should work" is not a result, and a green
  test suite is not proof that a feature works in the browser.
- **Tests**: never skip, delete or weaken a test. A test that encodes Redmine 5 markup or
  behaviour is updated to Redmine 7, with the reason in the commit. Every fix gets a test that
  fails without it.
- **Minimal diffs** in the plugin's own style. No reformatting, no unrelated refactoring.
  Something wrong elsewhere: write it down here, do not fix it in passing.
- **Security**: authorization on every action and entry point; `safe_attributes`, never
  `to_unsafe_hash` into `update`; no SQL built from params; no secrets in logs; no `html_safe` on
  user input.
- **Webhooks (new in Redmine 7)**: core sends issue payloads (core `issues/show.api.rsb`, rendered
  as the webhook owner) to webhook endpoints, past plugin hooks and controller patches. If the
  plugin hides, adds or changes issue data, make webhooks consistent with that or record why not.
- **Redmine 7 conventions**: SVG icons through `sprite_icon` (the `icon icon-*` CSS is gone),
  Propshaft assets under `assets/` (`/assets/plugin_assets/<id>/...`), the new header and user menu,
  `ContextMenus::*Controller`, Loofah-based text formatting, Chart.js as an ES module, sudo mode
  (on by default: `t.sudo()` in a scenario). The breaker list is in the migration kit's CHECKLIST.md.
- **Locales**: keep the locales the plugin ships in sync; translate a new key by matching the
  closest existing key in the same file, not from scratch; do not add new languages.
- **Redmine 7 only** (decided 2026-10-07): no 5.1 compatibility, no backports, no code paths that exist only for 5.1.
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why). Push after every
  commit, together with the updated status in this file: a cloud session can stop at a usage
  limit, and work that is not pushed is lost with its container.
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL and MariaDB
  (numbers in this file); boot, production-like eager load, migrations up/down OK.
- Every function in the inventory exercised end to end on a real running Redmine, with and
  without permissions and on its failure paths; `./.codex/e2e.sh` green; screenshots looked at,
  committed in `docs/e2e/` and listed.
- Review done: your own, and the OpenAI review when the key is present, every finding resolved
  in `docs/reviews/`.
- No new failure when run together with the other GEOxyz plugins.
- "After the upgrade" lists every action production needs; "Status" is current.


## Analysis report (2026-10-06, Dutch)

# redmine_editauthor
- Gebruikte branch: master @ 6b22e8f (2025-04-26) - plugin id redmine_editauthor, versie 0.11.1
- Upstream: nounder/redmine_editauthor (voorheen rgtk) - upstream HEAD master @ db98ca9 (2022-10-12)
- Fork t.o.v. upstream: 1 eigen commit (6b22e8f NL-locale), 0 upstream-commits ontbreken
- Andere relevante branches: upstream `scope` (2017), `performance` (2017) - oud, al in master verwerkt.
- Geen Gemfile, geen migraties. Tests: 5 functionele tests.

## 1. Werkt out of the box op Redmine 7?   DEELS
- Harness (results/1006-085401-...): OK boot, eager load, migraties, smoke 60/60.
- `FAIL minitest` 5 runs, 5 errors: `ArgumentError: unknown keywords: :id, :issue` - test/functional/issues_controller_test.rb:19..50 gebruiken de pre-Rails-5-syntax `get :edit, id: 1`. Faalt al sinds Redmine 4, niet R7-specifiek. De plugin zelf werkt.

## 2. Upstream sync?   UPSTREAM DOOD
- Laatste upstream-commit 2022; fork bevat alles.

## 3. Werkt na sync op Redmine 7?   n.v.t.

## 4. Complexiteit en blokkers   score 1
- Blokkers: geen in de plugin. Tests omgezet naar `params: {...}` (asserties ongewijzigd) - d177c48 -> 5 runs, 0 failures.
- Live geverifieerd (admin):
  - Issue-bewerkformulier: `#editauthor` staat vóór de tracker-paragraaf (inline jQuery `insertBefore($('#issue_tracker_id').parent())` werkt nog op het 7.0-formulier), ook na herladen van het formulier door trackerwissel.
  - Auteur wijzigen en opslaan werkt; journal toont "Author changed from Redmine Admin to Dev Verify0" (hook `helper_issues_show_detail_after_setting` bestaat nog in 7.0).
  - Nieuw issue (set_original_issue_author) en bulk edit tonen het veld.
- Stille breuken: geen gevonden. `possible_authors` gebruikt `Role#permissions` via pluck - werkt.
- Conflicten: redmine_inline_edit_issues zet attributen via `issue.update(params.to_unsafe_hash)` en omzeilt zo de safe_attributes-regel van deze plugin: auteur wijzigen kan daar zonder `edit_issue_author` (live aangetoond, zie inline_edit-rapport).
- Overlap met Redmine 7 core: geen (core kan de auteur van een issue niet wijzigen).
- Open werk voor ansif: geen voor de migratie.

## Branch redmine70-migration
- Basis: origin/master @ 6b22e8f
- Commits: d177c48 Use keyword params in functional tests
- Eindresultaat harness (results/1006-094347-s3-redmine_editauthor_redmine70-migration): OK bundle, boot 0.11.1, eager load, migraties dev+test, OK minitest 5 runs, 8 assertions, 0 failures, 0 errors, OK smoke 60/60
- Rollback migraties: n.v.t.

