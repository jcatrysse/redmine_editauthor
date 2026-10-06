# set-original-issue-author

Run 2026-10-06T19:21:58.875Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](set-original-issue-author-new-form.png) | manager | `/projects/e2e-project/issues/new` | New issue form with the author select, Reporter E2E chosen |
| ![](set-original-issue-author-created.png) | manager | `/issues/9` | The issue is created with Reporter E2E as author, not the creating manager |
| ![](set-original-issue-author-tracker-change.png) | manager | `/projects/e2e-project/issues/new` | After a tracker change the form reloads and still shows exactly one author field |
| ![](set-original-issue-author-no-permission.png) | reporter | `/projects/e2e-project/issues/new` | Without set_original_issue_author the new form has no author field |
| ![](set-original-issue-author-forged-ignored.png) | reporter | `/issues/10` | A forged author_id on create is ignored, the reporter stays author |
