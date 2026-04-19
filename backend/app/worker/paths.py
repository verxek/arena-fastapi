import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "../../.."))

UPLOADS = os.path.join(PROJECT_ROOT, "uploads")


def get_task_paths(task_id: int):
    base = os.path.abspath("uploads")

    task_dir = os.path.join(base, "tasks", str(task_id))
    tests_dir = os.path.join(task_dir, "tests")
    sol_dir = os.path.join(task_dir, "solutions")
    build_dir = os.path.join(task_dir, "build")


    os.makedirs(task_dir, exist_ok=True)
    os.makedirs(tests_dir, exist_ok=True)
    os.makedirs(sol_dir, exist_ok=True)
    os.makedirs(build_dir, exist_ok=True)

    return {
        "task_dir": task_dir,
        "tests_dir": tests_dir,
        "sol_dir": sol_dir,
        "build_dir": build_dir,
    }