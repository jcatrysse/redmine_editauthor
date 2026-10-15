require File.expand_path('../../test_helper', __FILE__)

class IssuesControllerTest < ActionController::TestCase
  fixtures :projects, :enabled_modules, :issues, :users, :members,
           :member_roles, :roles, :documents, :attachments, :news,
           :tokens, :journals, :journal_details, :changesets,
           :trackers, :projects_trackers, :issue_statuses, :enumerations,
           :messages, :boards, :repositories, :wikis, :wiki_pages,
           :wiki_contents, :wiki_content_versions, :versions, :comments

  setup do
    # Add permission to Manager role (hence, to jsmith)
    manager_role = Role.find(1)
    manager_role.add_permission!(:edit_issue_author)
  end

  test "author field as authorized user in new" do
    session[:user_id] = 2
    get :new, params: { id: 1 }

    assert_select '#issue_author_id', false
  end

  test "author field as authorized user in edit" do
    session[:user_id] = 2
    get :edit, params: { id: 1 }

    assert_select '#issue_author_id'
  end

  test "author field as unauthorized user in edit" do
    session[:user_id] = 3
    get :edit, params: { id: 1 }

    assert_select '#issue_author_id', false
  end

  test "update author as authorized user" do
    session[:user_id] = 2

    assert_difference('Journal.count') do
      put :update, params: { id: 1, issue: { author_id: 1 } }
    end
  end

  test "update author as unauthorized user" do
    session[:user_id] = 3

    assert_no_difference('Journal.count') do
      put :update, params: { id: 1, issue: { author_id: 3 } }
    end
  end

  test "update author changes the author and names it in the journal" do
    session[:user_id] = 2

    put :update, params: { id: 1, issue: { author_id: 1 } }

    assert_equal 1, Issue.find(1).author_id
    detail = Journal.order(:id).last.details.detect { |d| d.prop_key == 'author_id' }
    assert_equal '2', detail.old_value
    assert_equal '1', detail.value
  end

  test "update author as unauthorized user keeps the author but saves other attributes" do
    session[:user_id] = 3

    put :update, params: { id: 1, issue: { author_id: 3, subject: 'changed by dlopper' } }

    issue = Issue.find(1)
    assert_equal 'changed by dlopper', issue.subject
    assert_equal 2, issue.author_id
  end

  test "author field in new with set_original_issue_author" do
    Role.find(1).add_permission!(:set_original_issue_author)
    session[:user_id] = 2
    get :new, params: { project_id: 1 }

    assert_select '#issue_author_id'
  end

  test "create issue with another author needs set_original_issue_author" do
    session[:user_id] = 2
    assert_difference('Issue.count') do
      post :create, params: { project_id: 1, issue: { tracker_id: 1, subject: 'a', author_id: 3 } }
    end
    assert_equal 2, Issue.order(:id).last.author_id

    Role.find(1).add_permission!(:set_original_issue_author)
    assert_difference('Issue.count') do
      post :create, params: { project_id: 1, issue: { tracker_id: 1, subject: 'b', author_id: 3 } }
    end
    assert_equal 3, Issue.order(:id).last.author_id
  end

  test "author field in bulk edit as authorized user" do
    session[:user_id] = 2
    get :bulk_edit, params: { ids: [1, 2] }

    assert_select '#issue_author_id option:first-child[value=""]'
  end

  test "author field in bulk edit as unauthorized user" do
    Role.find(1).remove_permission!(:edit_issue_author)
    session[:user_id] = 2
    get :bulk_edit, params: { ids: [1, 2] }

    assert_select '#issue_author_id', false
  end

  test "bulk update author" do
    session[:user_id] = 2
    post :bulk_update, params: { ids: [1, 2], issue: { author_id: 3 } }

    assert_equal [3, 3], Issue.where(id: [1, 2]).pluck(:author_id)
  end

  def author_ids(settings = {})
    with_settings plugin_redmine_editauthor: settings do
      get :edit, params: { id: 1 }
    end
    css_select('#issue_author_id option').map { |o| o['value'].to_i }.sort
  end

  def setup_scope_users
    # not a member of project 1, but holds a role that may add issues (project 2)
    @elsewhere = User.generate!
    Member.create!(user: @elsewhere, project: Project.find(2), roles: [Role.find(2)])
    # member of project 1 with a role that may not add issues
    viewer_role = Role.generate!(permissions: [:view_issues])
    @viewer = User.generate!
    Member.create!(user: @viewer, project: Project.find(1), roles: [viewer_role])
  end

  test "default scope lists project members who may add issues only" do
    setup_scope_users
    session[:user_id] = 2
    ids = author_ids

    assert_includes ids, 2
    assert_not_includes ids, @elsewhere.id
    assert_not_includes ids, @viewer.id
  end

  test "any_role scope lists everyone holding a role that may add issues" do
    setup_scope_users
    session[:user_id] = 2
    ids = author_ids('authors_scope' => 'any_role')

    assert_includes ids, @elsewhere.id
    assert_not_includes ids, @viewer.id
  end

  test "project_members scope lists all project members" do
    setup_scope_users
    session[:user_id] = 2
    ids = author_ids('authors_scope' => 'project_members')

    assert_includes ids, @viewer.id
    assert_not_includes ids, @elsewhere.id
    assert_equal Project.find(1).users.sorted.map(&:id).sort, ids
  end

  test "legacy members_scope checkbox still means project_members" do
    setup_scope_users
    session[:user_id] = 2

    assert_includes author_ids('members_scope' => '1'), @viewer.id
    assert_not_includes author_ids('members_scope' => '1', 'authors_scope' => 'any_role'), @viewer.id
  end

  test "default scope does not grow with users outside the project" do
    session[:user_id] = 2
    before = author_ids
    20.times do
      user = User.generate!
      Member.create!(user: user, project: Project.find(2), roles: [Role.find(2)])
    end

    assert_equal before, author_ids
  end

  test "current author stays selectable when not in the scope" do
    setup_scope_users
    Issue.find(1).update_column(:author_id, @elsewhere.id)
    session[:user_id] = 2

    assert_includes author_ids, @elsewhere.id
  end
end
