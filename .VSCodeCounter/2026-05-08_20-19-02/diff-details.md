# Diff Details

Date : 2026-05-08 20:19:02

Directory d:\\vscodeProjects\\arena-fastapi

Total : 115 files,  11409 codes, 591 comments, 1661 blanks, all 13661 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [alembic.ini](/alembic.ini) | Ini | 123 | 0 | 27 | 150 |
| [alembic/env.py](/alembic/env.py) | Python | 33 | 1 | 5 | 39 |
| [alembic/versions/14cc2b6241d1\_change\_contest\_duration\_to\_interval.py](/alembic/versions/14cc2b6241d1_change_contest_duration_to_interval.py) | Python | 23 | 9 | 8 | 40 |
| [alembic/versions/154a09fc8b90\_add\_task\_formats\_and\_examples.py](/alembic/versions/154a09fc8b90_add_task_formats_and_examples.py) | Python | 15 | 14 | 8 | 37 |
| [alembic/versions/20a76f6bfbbd\_update\_refresh\_token.py](/alembic/versions/20a76f6bfbbd_update_refresh_token.py) | Python | 18 | 14 | 7 | 39 |
| [alembic/versions/2666a1d2893d\_add\_user\_role\_enum.py](/alembic/versions/2666a1d2893d_add_user_role_enum.py) | Python | 39 | 8 | 14 | 61 |
| [alembic/versions/365141da0201\_add\_task\_business\_logic.py](/alembic/versions/365141da0201_add_task_business_logic.py) | Python | 188 | 16 | 22 | 226 |
| [alembic/versions/3a5535ff9bf8\_set\_default\_points\_by\_difficulty.py](/alembic/versions/3a5535ff9bf8_set_default_points_by_difficulty.py) | Python | 47 | 10 | 26 | 83 |
| [alembic/versions/4bc29189a46a\_change\_duration\_to\_integer\_minutes.py](/alembic/versions/4bc29189a46a_change_duration_to_integer_minutes.py) | Python | 25 | 10 | 9 | 44 |
| [alembic/versions/4ec22bd48818\_add\_sandbox\_structures.py](/alembic/versions/4ec22bd48818_add_sandbox_structures.py) | Python | 81 | 11 | 16 | 108 |
| [alembic/versions/4ff3cdc93c91\_change\_task\_status\_default.py](/alembic/versions/4ff3cdc93c91_change_task_status_default.py) | Python | 22 | 11 | 9 | 42 |
| [alembic/versions/51f2c9ee33bb\_add\_contest\_user\_structures.py](/alembic/versions/51f2c9ee33bb_add_contest_user_structures.py) | Python | 114 | 16 | 17 | 147 |
| [alembic/versions/5e5918ce4ac4\_add\_many\_sandboxes\_per\_one\_solution.py](/alembic/versions/5e5918ce4ac4_add_many_sandboxes_per_one_solution.py) | Python | 33 | 14 | 7 | 54 |
| [alembic/versions/76c8aeeeae60\_add\_contest\_task\_structures.py](/alembic/versions/76c8aeeeae60_add_contest_task_structures.py) | Python | 124 | 13 | 18 | 155 |
| [alembic/versions/809f83b210bb\_added\_points\_to\_task.py](/alembic/versions/809f83b210bb_added_points_to_task.py) | Python | 19 | 14 | 8 | 41 |
| [alembic/versions/970c436f43d3\_add\_task\_ready\_status.py](/alembic/versions/970c436f43d3_add_task_ready_status.py) | Python | 11 | 14 | 8 | 33 |
| [alembic/versions/9cfa7421329f\_populate\_reference\_data.py](/alembic/versions/9cfa7421329f_populate_reference_data.py) | Python | 112 | 16 | 20 | 148 |
| [alembic/versions/b3713b96323a\_add\_solution\_structures.py](/alembic/versions/b3713b96323a_add_solution_structures.py) | Python | 117 | 11 | 15 | 143 |
| [alembic/versions/d87686434be7\_add\_refresh\_token.py](/alembic/versions/d87686434be7_add_refresh_token.py) | Python | 19 | 14 | 8 | 41 |
| [alembic/versions/d9bc72401ac6\_add\_contest\_structures.py](/alembic/versions/d9bc72401ac6_add_contest_structures.py) | Python | 242 | 20 | 28 | 290 |
| [alembic/versions/eeaa26a3abcc\_add\_user\_triggers\_procedures\_views.py](/alembic/versions/eeaa26a3abcc_add_user_triggers_procedures_views.py) | Python | 240 | 23 | 23 | 286 |
| [alembic/versions/f691882dbdf6\_add\_unique\_to\_nickname.py](/alembic/versions/f691882dbdf6_add_unique_to_nickname.py) | Python | 13 | 14 | 8 | 35 |
| [backend/app/database.py](/backend/app/database.py) | Python | 19 | 1 | 6 | 26 |
| [backend/app/dependencies/auth.py](/backend/app/dependencies/auth.py) | Python | 3 | 1 | -1 | 3 |
| [backend/app/main.py](/backend/app/main.py) | Python | 19 | -1 | 8 | 26 |
| [backend/app/models/contest.py](/backend/app/models/contest.py) | Python | 16 | -2 | 1 | 15 |
| [backend/app/models/sandbox.py](/backend/app/models/sandbox.py) | Python | -5 | -1 | 2 | -4 |
| [backend/app/models/solution.py](/backend/app/models/solution.py) | Python | -3 | 0 | 0 | -3 |
| [backend/app/models/task.py](/backend/app/models/task.py) | Python | 5 | 0 | 3 | 8 |
| [backend/app/models/user.py](/backend/app/models/user.py) | Python | 36 | 10 | 15 | 61 |
| [backend/app/repositories/contest.py](/backend/app/repositories/contest.py) | Python | -18 | 0 | -3 | -21 |
| [backend/app/repositories/task.py](/backend/app/repositories/task.py) | Python | 8 | 0 | 4 | 12 |
| [backend/app/routes/admin.py](/backend/app/routes/admin.py) | Python | 34 | 0 | 5 | 39 |
| [backend/app/routes/auth.py](/backend/app/routes/auth.py) | Python | -7 | -2 | -2 | -11 |
| [backend/app/routes/contests.py](/backend/app/routes/contests.py) | Python | 35 | -12 | 12 | 35 |
| [backend/app/routes/solution.py](/backend/app/routes/solution.py) | Python | 44 | 0 | 9 | 53 |
| [backend/app/routes/tasks.py](/backend/app/routes/tasks.py) | Python | 111 | 1 | 15 | 127 |
| [backend/app/routes/test\_roles.py](/backend/app/routes/test_roles.py) | Python | -19 | 0 | -7 | -26 |
| [backend/app/routes/users.py](/backend/app/routes/users.py) | Python | 8 | 0 | -1 | 7 |
| [backend/app/scheduler/scheduler.py](/backend/app/scheduler/scheduler.py) | Python | 29 | 0 | 13 | 42 |
| [backend/app/schemas/auth.py](/backend/app/schemas/auth.py) | Python | 13 | 0 | 5 | 18 |
| [backend/app/schemas/contest.py](/backend/app/schemas/contest.py) | Python | 23 | 0 | 4 | 27 |
| [backend/app/schemas/task.py](/backend/app/schemas/task.py) | Python | 8 | 1 | -4 | 5 |
| [backend/app/schemas/user.py](/backend/app/schemas/user.py) | Python | 10 | -2 | 3 | 11 |
| [backend/app/services/admin\_service.py](/backend/app/services/admin_service.py) | Python | 54 | 2 | 20 | 76 |
| [backend/app/services/auth.py](/backend/app/services/auth.py) | Python | 53 | 0 | 14 | 67 |
| [backend/app/services/contest\_service.py](/backend/app/services/contest_service.py) | Python | 186 | 7 | 74 | 267 |
| [backend/app/services/scoring.py](/backend/app/services/scoring.py) | Python | 82 | 31 | 27 | 140 |
| [backend/app/services/solution\_service.py](/backend/app/services/solution_service.py) | Python | 89 | 3 | 28 | 120 |
| [backend/app/services/task\_service.py](/backend/app/services/task_service.py) | Python | 179 | 11 | 46 | 236 |
| [backend/app/services/user\_service.py](/backend/app/services/user_service.py) | Python | 14 | 0 | 5 | 19 |
| [backend/app/services/verification\_service.py](/backend/app/services/verification_service.py) | Python | 41 | 1 | 19 | 61 |
| [backend/app/worker/\_\_init\_\_.py](/backend/app/worker/__init__.py) | Python | 0 | 0 | 1 | 1 |
| [backend/app/worker/cache.py](/backend/app/worker/cache.py) | Python | 2 | 0 | 0 | 2 |
| [backend/app/worker/celery\_app.py](/backend/app/worker/celery_app.py) | Python | 12 | 0 | 5 | 17 |
| [backend/app/worker/executor.py](/backend/app/worker/executor.py) | Python | 92 | 12 | 29 | 133 |
| [backend/app/worker/executor\_docker.py](/backend/app/worker/executor_docker.py) | Python | 56 | 9 | 14 | 79 |
| [backend/app/worker/paths.py](/backend/app/worker/paths.py) | Python | 20 | 0 | 8 | 28 |
| [backend/app/worker/redis\_client.py](/backend/app/worker/redis_client.py) | Python | 7 | 0 | 1 | 8 |
| [backend/app/worker/tasks.py](/backend/app/worker/tasks.py) | Python | 204 | 51 | 64 | 319 |
| [backend/app/worker/utils.py](/backend/app/worker/utils.py) | Python | 4 | 0 | 1 | 5 |
| [frontend/README.md](/frontend/README.md) | Markdown | 9 | 0 | 8 | 17 |
| [frontend/eslint.config.js](/frontend/eslint.config.js) | JavaScript | 28 | 0 | 2 | 30 |
| [frontend/index.html](/frontend/index.html) | HTML | 13 | 0 | 1 | 14 |
| [frontend/package-lock.json](/frontend/package-lock.json) | JSON | 2,978 | 0 | 1 | 2,979 |
| [frontend/package.json](/frontend/package.json) | JSON | 28 | 0 | 1 | 29 |
| [frontend/public/vite.svg](/frontend/public/vite.svg) | XML | 1 | 0 | 0 | 1 |
| [frontend/src/App.jsx](/frontend/src/App.jsx) | JavaScript JSX | 40 | 0 | 7 | 47 |
| [frontend/src/api/admin.js](/frontend/src/api/admin.js) | JavaScript | 12 | 0 | 3 | 15 |
| [frontend/src/api/auth.jsx](/frontend/src/api/auth.jsx) | JavaScript JSX | 25 | 11 | 6 | 42 |
| [frontend/src/api/client.js](/frontend/src/api/client.js) | JavaScript | 21 | 1 | 8 | 30 |
| [frontend/src/api/contests.js](/frontend/src/api/contests.js) | JavaScript | 37 | 0 | 11 | 48 |
| [frontend/src/api/solutions.js](/frontend/src/api/solutions.js) | JavaScript | 19 | 0 | 4 | 23 |
| [frontend/src/api/tasks.js](/frontend/src/api/tasks.js) | JavaScript | 45 | 6 | 13 | 64 |
| [frontend/src/api/users.js](/frontend/src/api/users.js) | JavaScript | 9 | 0 | 5 | 14 |
| [frontend/src/assets/icons.jsx](/frontend/src/assets/icons.jsx) | JavaScript JSX | 32 | 0 | 3 | 35 |
| [frontend/src/assets/react.svg](/frontend/src/assets/react.svg) | XML | 1 | 0 | 0 | 1 |
| [frontend/src/components/ContestCard.jsx](/frontend/src/components/ContestCard.jsx) | JavaScript JSX | 121 | 3 | 21 | 145 |
| [frontend/src/components/LoginModal.jsx](/frontend/src/components/LoginModal.jsx) | JavaScript JSX | 110 | 2 | 21 | 133 |
| [frontend/src/components/Modal.jsx](/frontend/src/components/Modal.jsx) | JavaScript JSX | 69 | 1 | 5 | 75 |
| [frontend/src/components/Navbar.jsx](/frontend/src/components/Navbar.jsx) | JavaScript JSX | 149 | 5 | 17 | 171 |
| [frontend/src/components/ProtectedRoute.jsx](/frontend/src/components/ProtectedRoute.jsx) | JavaScript JSX | 9 | 0 | 5 | 14 |
| [frontend/src/components/RatingTab.jsx](/frontend/src/components/RatingTab.jsx) | JavaScript JSX | 82 | 2 | 9 | 93 |
| [frontend/src/components/RegisterContestModal.jsx](/frontend/src/components/RegisterContestModal.jsx) | JavaScript JSX | 85 | 0 | 14 | 99 |
| [frontend/src/components/RegisterModal.jsx](/frontend/src/components/RegisterModal.jsx) | JavaScript JSX | 258 | 2 | 29 | 289 |
| [frontend/src/components/SubmissionsTab.jsx](/frontend/src/components/SubmissionsTab.jsx) | JavaScript JSX | 66 | 0 | 7 | 73 |
| [frontend/src/components/SubmitModal.jsx](/frontend/src/components/SubmitModal.jsx) | JavaScript JSX | 80 | 0 | 14 | 94 |
| [frontend/src/components/SubmitTab.jsx](/frontend/src/components/SubmitTab.jsx) | JavaScript JSX | 148 | 6 | 21 | 175 |
| [frontend/src/components/TaskItem.jsx](/frontend/src/components/TaskItem.jsx) | JavaScript JSX | 75 | 0 | 9 | 84 |
| [frontend/src/components/TasksTab.jsx](/frontend/src/components/TasksTab.jsx) | JavaScript JSX | 103 | 1 | 12 | 116 |
| [frontend/src/hooks/useAuth.js](/frontend/src/hooks/useAuth.js) | JavaScript | 0 | 0 | 1 | 1 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | 70 | 1 | 10 | 81 |
| [frontend/src/layouts/MainLayout.jsx](/frontend/src/layouts/MainLayout.jsx) | JavaScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/main.jsx](/frontend/src/main.jsx) | JavaScript JSX | 10 | 0 | 2 | 12 |
| [frontend/src/pages/AdminPanel.jsx](/frontend/src/pages/AdminPanel.jsx) | JavaScript JSX | 144 | 2 | 24 | 170 |
| [frontend/src/pages/Archive.jsx](/frontend/src/pages/Archive.jsx) | JavaScript JSX | 167 | 6 | 28 | 201 |
| [frontend/src/pages/ContestMenu.jsx](/frontend/src/pages/ContestMenu.jsx) | JavaScript JSX | 184 | 4 | 36 | 224 |
| [frontend/src/pages/Contests.jsx](/frontend/src/pages/Contests.jsx) | JavaScript JSX | 167 | 3 | 29 | 199 |
| [frontend/src/pages/CreateContest.jsx](/frontend/src/pages/CreateContest.jsx) | JavaScript JSX | 404 | 16 | 50 | 470 |
| [frontend/src/pages/CreateTask.jsx](/frontend/src/pages/CreateTask.jsx) | JavaScript JSX | 282 | 14 | 33 | 329 |
| [frontend/src/pages/Drafts.jsx](/frontend/src/pages/Drafts.jsx) | JavaScript JSX | 60 | 0 | 8 | 68 |
| [frontend/src/pages/EditTask.jsx](/frontend/src/pages/EditTask.jsx) | JavaScript JSX | 191 | 13 | 42 | 246 |
| [frontend/src/pages/Home.jsx](/frontend/src/pages/Home.jsx) | JavaScript JSX | 131 | 4 | 20 | 155 |
| [frontend/src/pages/MySubmissions.jsx](/frontend/src/pages/MySubmissions.jsx) | JavaScript JSX | 106 | 3 | 15 | 124 |
| [frontend/src/pages/OrganizerHome.jsx](/frontend/src/pages/OrganizerHome.jsx) | JavaScript JSX | 137 | 3 | 23 | 163 |
| [frontend/src/pages/Profile.jsx](/frontend/src/pages/Profile.jsx) | JavaScript JSX | 108 | 3 | 20 | 131 |
| [frontend/src/pages/StudentHome.jsx](/frontend/src/pages/StudentHome.jsx) | JavaScript JSX | 131 | 3 | 23 | 157 |
| [frontend/src/pages/Task.jsx](/frontend/src/pages/Task.jsx) | JavaScript JSX | 107 | 4 | 21 | 132 |
| [frontend/src/pages/Tasks.jsx](/frontend/src/pages/Tasks.jsx) | JavaScript JSX | 157 | 3 | 36 | 196 |
| [frontend/src/styles/global.css](/frontend/src/styles/global.css) | PostCSS | 949 | 38 | 208 | 1,195 |
| [frontend/src/utils/contestUtils.js](/frontend/src/utils/contestUtils.js) | JavaScript | 49 | 36 | 16 | 101 |
| [frontend/vite.config.js](/frontend/vite.config.js) | JavaScript | 5 | 1 | 2 | 8 |
| [package-lock.json](/package-lock.json) | JSON | 31 | 0 | 1 | 32 |
| [package.json](/package.json) | JSON | 5 | 0 | 1 | 6 |
| [requirements.txt](/requirements.txt) | pip requirements | 39 | 0 | 0 | 39 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details