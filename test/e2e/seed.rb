# Plugin data for the end-to-end checks: a member whose role cannot add issues (listed as author
# only with the "members only" setting) and the administrator as a member with that same role
# (listed by the plugin's "admin" clause), both in e2e-project.
User.current = User.find_by!(login: 'admin')
project = Project.find_by!(identifier: 'e2e-project')

role = Role.find_by(name: 'E2E viewer') || Role.new(name: 'E2E viewer')
role.permissions = [:view_issues]
role.issues_visibility = 'all'
role.save!

viewer = User.find_by(login: 'viewer') || User.new(login: 'viewer', firstname: 'Viewer', lastname: 'E2E', mail: 'viewer@example.net')
viewer.password = viewer.password_confirmation = ENV.fetch('RMP_USER_PASSWORD', ENV.fetch('RMP_ADMIN_PASSWORD', 'Redmine7Test!'))
viewer.must_change_passwd = false
viewer.status = User::STATUS_ACTIVE
viewer.save!(validate: false)

[viewer, User.find_by!(login: 'admin')].each do |u|
  Member.create!(principal: u, project: project, roles: [role]) unless Member.where(user_id: u.id, project_id: project.id).exists?
end

# A member who may edit issues (also in bulk) but has none of the plugin's permissions.
editor_role = Role.find_by(name: 'E2E editor') || Role.new(name: 'E2E editor')
editor_role.permissions = [:view_issues, :add_issues, :edit_issues]
editor_role.issues_visibility = 'all'
editor_role.save!
editor = User.find_by(login: 'editor') || User.new(login: 'editor', firstname: 'Editor', lastname: 'E2E', mail: 'editor@example.net')
editor.password = editor.password_confirmation = ENV.fetch('RMP_USER_PASSWORD', ENV.fetch('RMP_ADMIN_PASSWORD', 'Redmine7Test!'))
editor.must_change_passwd = false
editor.status = User::STATUS_ACTIVE
editor.save!(validate: false)
Member.create!(principal: editor, project: project, roles: [editor_role]) unless Member.where(user_id: editor.id, project_id: project.id).exists?
