# Details

Date : 2026-03-18 00:39:30

Directory d:\\vscodeProjects\\arena-fastapi\\backend

Total : 45 files,  2300 codes, 245 comments, 572 blanks, all 3117 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/\_\_init\_\_.py](/backend/__init__.py) | Python | 0 | 0 | 1 | 1 |
| [backend/app/\_\_init\_\_.py](/backend/app/__init__.py) | Python | 0 | 0 | 1 | 1 |
| [backend/app/config.py](/backend/app/config.py) | Python | 16 | 0 | 3 | 19 |
| [backend/app/core/security.py](/backend/app/core/security.py) | Python | 32 | 5 | 17 | 54 |
| [backend/app/database.py](/backend/app/database.py) | Python | 44 | 6 | 7 | 57 |
| [backend/app/dependencies/auth.py](/backend/app/dependencies/auth.py) | Python | 40 | 0 | 11 | 51 |
| [backend/app/main.py](/backend/app/main.py) | Python | 21 | 1 | 4 | 26 |
| [backend/app/models/\_\_init\_\_.py](/backend/app/models/__init__.py) | Python | 13 | 0 | 2 | 15 |
| [backend/app/models/contest.py](/backend/app/models/contest.py) | Python | 69 | 10 | 15 | 94 |
| [backend/app/models/contest\_task.py](/backend/app/models/contest_task.py) | Python | 51 | 7 | 13 | 71 |
| [backend/app/models/contest\_user.py](/backend/app/models/contest_user.py) | Python | 45 | 6 | 11 | 62 |
| [backend/app/models/dictionaries.py](/backend/app/models/dictionaries.py) | Python | 127 | 27 | 55 | 209 |
| [backend/app/models/password\_reset.py](/backend/app/models/password_reset.py) | Python | 39 | 12 | 13 | 64 |
| [backend/app/models/refresh\_token.py](/backend/app/models/refresh_token.py) | Python | 9 | 0 | 3 | 12 |
| [backend/app/models/sandbox.py](/backend/app/models/sandbox.py) | Python | 61 | 8 | 13 | 82 |
| [backend/app/models/session.py](/backend/app/models/session.py) | Python | 45 | 14 | 12 | 71 |
| [backend/app/models/solution.py](/backend/app/models/solution.py) | Python | 80 | 10 | 14 | 104 |
| [backend/app/models/task.py](/backend/app/models/task.py) | Python | 75 | 6 | 13 | 94 |
| [backend/app/models/user.py](/backend/app/models/user.py) | Python | 70 | 3 | 9 | 82 |
| [backend/app/repositories/\_\_init\_\_.py](/backend/app/repositories/__init__.py) | Python | 0 | 0 | 1 | 1 |
| [backend/app/repositories/base.py](/backend/app/repositories/base.py) | Python | 4 | 0 | 2 | 6 |
| [backend/app/repositories/contest.py](/backend/app/repositories/contest.py) | Python | 36 | 0 | 9 | 45 |
| [backend/app/repositories/contest\_task.py](/backend/app/repositories/contest_task.py) | Python | 20 | 0 | 6 | 26 |
| [backend/app/repositories/solution.py](/backend/app/repositories/solution.py) | Python | 29 | 0 | 6 | 35 |
| [backend/app/repositories/task.py](/backend/app/repositories/task.py) | Python | 21 | 0 | 6 | 27 |
| [backend/app/repositories/user.py](/backend/app/repositories/user.py) | Python | 31 | 0 | 8 | 39 |
| [backend/app/routes/auth.py](/backend/app/routes/auth.py) | Python | 87 | 2 | 24 | 113 |
| [backend/app/routes/contests.py](/backend/app/routes/contests.py) | Python | 84 | 13 | 20 | 117 |
| [backend/app/routes/test\_roles.py](/backend/app/routes/test_roles.py) | Python | 19 | 0 | 7 | 26 |
| [backend/app/routes/users.py](/backend/app/routes/users.py) | Python | 10 | 0 | 3 | 13 |
| [backend/app/schemas/\_\_init\_\_.py](/backend/app/schemas/__init__.py) | Python | 5 | 0 | 0 | 5 |
| [backend/app/schemas/auth.py](/backend/app/schemas/auth.py) | Python | 11 | 0 | 6 | 17 |
| [backend/app/schemas/contest.py](/backend/app/schemas/contest.py) | Python | 36 | 0 | 7 | 43 |
| [backend/app/schemas/solution.py](/backend/app/schemas/solution.py) | Python | 14 | 0 | 5 | 19 |
| [backend/app/schemas/task.py](/backend/app/schemas/task.py) | Python | 29 | 0 | 12 | 41 |
| [backend/app/schemas/user.py](/backend/app/schemas/user.py) | Python | 13 | 2 | 7 | 22 |
| [backend/app/services/auth.py](/backend/app/services/auth.py) | Python | 52 | 0 | 14 | 66 |
| [backend/scripts/create\_org.py](/backend/scripts/create_org.py) | Python | 50 | 14 | 13 | 77 |
| [backend/scripts/init\_db.py](/backend/scripts/init_db.py) | Python | 19 | 0 | 6 | 25 |
| [backend/scripts/test\_business\_logic.py](/backend/scripts/test_business_logic.py) | Python | 24 | 5 | 6 | 35 |
| [backend/scripts/test\_contest\_structures.py](/backend/scripts/test_contest_structures.py) | Python | 170 | 19 | 42 | 231 |
| [backend/scripts/test\_contest\_task\_structures.py](/backend/scripts/test_contest_task_structures.py) | Python | 177 | 20 | 36 | 233 |
| [backend/scripts/test\_contest\_user\_structures.py](/backend/scripts/test_contest_user_structures.py) | Python | 175 | 13 | 37 | 225 |
| [backend/scripts/test\_solution\_sandbox\_structures.py](/backend/scripts/test_solution_sandbox_structures.py) | Python | 168 | 26 | 39 | 233 |
| [backend/scripts/test\_task\_structures.py](/backend/scripts/test_task_structures.py) | Python | 179 | 16 | 33 | 228 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)