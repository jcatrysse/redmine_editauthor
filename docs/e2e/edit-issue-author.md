# edit-issue-author

Run 2026-10-06T19:24:07.982Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](edit-issue-author-edit-form.png) | manager | `/issues/12/edit` | Edit form with the author select above the tracker, for a member with edit_issue_author |
| ![](edit-issue-author-journal.png) | manager | `/issues/12` | History shows "Author changed from Manager E2E to Reporter E2E" with names, not ids |
| ![](edit-issue-author-no-permission.png) | reporter | `/issues/12/edit` | Without edit_issue_author the edit form has no author field |
| ![](edit-issue-author-forged-ignored.png) | reporter | `/issues/12` | A forged issue[author_id] from a user without the permission is ignored, author unchanged |
| ![](edit-issue-author-outsider.png) | outsider | `/issues/6` | Outsider gets no access to a private issue |
