# bulk-edit-author

Run 2026-10-06T19:24:50.426Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](bulk-edit-author-bulk-form.png) | manager | `/issues/bulk_edit?ids[]=2&ids[]=3` | Bulk edit form with the author select, "(No change)" first |
| ![](bulk-edit-author-bulk-result.png) | manager | `/issues/3` | Issue 3 after the bulk edit shows the new author |
| ![](bulk-edit-author-no-permission.png) | reporter | `/issues/bulk_edit?ids[]=2&ids[]=3` | Without edit permission bulk edit is refused, no author field reachable |
| ![](bulk-edit-author-editor-no-permission.png) | editor | `/issues/bulk_edit?ids[]=2&ids[]=3` | An editor without edit_issue_author: bulk edit works but has no author field |
| ![](bulk-edit-author-editor-forged-ignored.png) | editor | `/issues/2` | A forged bulk author_id from an editor without the permission is ignored |
