# Redmine Edit Issue Author

Redmine plugin that allows to change issue author.


## Installation

Follow standard Redmine plugin installation procedure.

 * Move `redmine_editauthor/` to `$REDMINE/plugins/`.


## Configuration

#### Permissions

This plugin provides 2 permissions:

 * *Edit author* allows to edit author of existing issue.
 * *Set original author* allows to set author when creating new issue.

Authorized users will be able to see author field and change its value in issue
form.
    

#### Possible authors

 The plugin setting *Possible authors* decides who can be chosen as author:

 * *Project members who may add issues* (default): fast, also on large installations.
 * *Anyone with a role that may add issues in any project*: the behaviour of
   versions up to 0.11.1.
 * *All project members*: the former "Narrow authors to members" checkbox; a saved
   value of that checkbox still counts until the new setting is saved.

 The current author of an issue always stays selectable.


## Requirements

This plugin has been written with compatibility in mind to keep it
functional across many different versions of Redmine:

  * Redmine (`>= 3.0`)
