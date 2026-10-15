# rest-api-author

Run 2026-10-15T04:20:58.643Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](rest-api-author-result.png) | admin | `/issues/17` | API calls: create with author: POST /issues.json as manager -> HTTP 201 | change author: PUT /issues/17.json as manager -> HTTP 204 | create as editor: POST /issues.json as editor -> HTTP 201 | update as editor: PUT /issues/18.json as editor -> HTTP 204 | issue JSON author after change: {"id":1,"name":"Redmine Admin"} |
