module RedmineEditauthor
  module Hook
    class ViewListener < Redmine::Hook::ViewListener
      include IssuesHelper

      AUTHORS_SCOPES = %w[project_add_issues any_role project_members].freeze

      # necessary for using content_tag in Listener
      attr_accessor :output_buffer

      def view_issues_form_details_bottom(context = {})
        issue, project = context.values_at(:issue, :project)

        if issue.new_record? && !User.current.allowed_to?(:set_original_issue_author, project) \
          or issue.persisted? && !User.current.allowed_to?(:edit_issue_author, project)
          return
        end

        author = issue.author

        content_tag(:p, id: 'editauthor') do
          authors = possible_authors(issue.project).to_a

          authors.unshift(author) if author && !authors.include?(author)

          o = options_from_collection_for_select(authors, 'id', 'name',
                                                 issue.author_id)

          author_select_field(o)
        end
      end

      def view_issues_bulk_edit_details_bottom(context = {})
        project = context[:project]

        return if !project || !User.current.allowed_to?(:edit_issue_author, project)

        content_tag(:p, id: 'editauthor') do
          authors = possible_authors(project)

          o = content_tag('option', l(:label_no_change_option), :value => '') \
              + options_from_collection_for_select(authors, 'id', 'name')

          author_select_field(o)
        end
      end

      def helper_issues_show_detail_after_setting(context = {})
        d = context[:detail]

        return if d.prop_key != 'author_id'

        d[:value] = find_name_by_reflection('author', d.value)
        d[:old_value] = find_name_by_reflection('author', d.old_value)
      end

      private

      def possible_authors(project)
        case authors_scope
        when 'project_members'
          project.users.sorted
        when 'any_role'
          role_ids = Role.joins(:members)
                       .where(members: { project_id: project.id })
                       .distinct(:id)
                       .pluck(:id, :permissions)
                       .select { |_, perms| perms.include?(:add_issues) }
                       .map(&:first)

          User.active.sorted.joins(members: :roles).distinct(:id)
            .where("#{MemberRole.table_name}.role_id IN (?) OR #{User.table_name}.admin = ?",
                   role_ids, true)
        else
          role_ids = Role.joins(:members)
                       .where(members: { project_id: project.id })
                       .distinct(:id)
                       .pluck(:id, :permissions)
                       .select { |_, perms| perms.include?(:add_issues) }
                       .map(&:first)
          project_members = Member.where(project_id: project.id)

          User.active.sorted
            .where(id: project_members.joins(:member_roles)
                                      .where(member_roles: { role_id: role_ids })
                                      .select(:user_id))
            .or(User.active.sorted.where(admin: true, id: project_members.select(:user_id)))
        end
      end

      # 'project_add_issues' (default): project members who may add issues,
      # 'any_role': everyone holding such a role in any project, 'project_members': all members.
      # The former checkbox members_scope still counts when authors_scope was never saved.
      def authors_scope
        scope = Settings.authors_scope
        return scope if AUTHORS_SCOPES.include?(scope)

        Settings.members_scope? ? 'project_members' : 'project_add_issues'
      end

      def author_select_field(options)
        label_tag('issue[author_id]', l(:field_author)) \
        + select_tag('issue[author_id]', options) \
        + "<script>$('#editauthor').insertBefore($('#issue_tracker_id').parent());</script>"
            .html_safe
      end
    end
  end
end
