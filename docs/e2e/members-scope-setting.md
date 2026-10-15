# members-scope-setting

Run 2026-10-15T04:20:55.510Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](members-scope-setting-setting-default.png) | admin | `/settings/plugin/redmine_editauthor` | Plugin settings as shipped, selected: project_add_issues |
| ![](members-scope-setting-setting-project-add-issues.png) | admin | `/settings/plugin/redmine_editauthor` | Plugin settings, possible authors: project_add_issues |
| ![](members-scope-setting-authors-project-add-issues.png) | manager | `/projects/e2e-project/issues/new` | Project members who may add issues: Editor E2E, Manager E2E, Redmine Admin, Reporter E2E |
| ![](members-scope-setting-setting-any-role.png) | admin | `/settings/plugin/redmine_editauthor` | Plugin settings, possible authors: any_role |
| ![](members-scope-setting-authors-any-role.png) | manager | `/projects/e2e-project/issues/new` | Anyone with such a role in any project: Editor E2E, Elsewhere E2E, Manager E2E, Redmine Admin, Reporter E2E |
| ![](members-scope-setting-setting-project-members.png) | admin | `/settings/plugin/redmine_editauthor` | Plugin settings, possible authors: project_members |
| ![](members-scope-setting-authors-project-members.png) | manager | `/projects/e2e-project/issues/new` | All project members: Editor E2E, Manager E2E, Redmine Admin, Reporter E2E, Viewer E2E |
| ![](members-scope-setting-no-permission.png) | reporter | `/projects/e2e-project/issues/new` | Without the plugin permission there is no author field in any stage |
| ![](members-scope-setting-settings-refused.png) | outsider | `/settings/plugin/redmine_editauthor` | The setting page is for administrators only |
| ![](members-scope-setting-setting-restored.png) | admin | `/settings/plugin/redmine_editauthor` | Plugin settings, possible authors: project_add_issues |
