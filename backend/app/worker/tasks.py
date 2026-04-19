from backend.app.worker.celery_app import celery
from backend.app.worker.executor import (
    compile_cpp_container,
    run_python_container,
    run_cpp_container,
    run_with_limits
)

from sqlalchemy import update
from backend.app.models.task import Task
from backend.app.database import SessionLocal
from backend.app.worker.paths import get_task_paths

import os
import time
from backend.app.worker.utils import file_hash
from backend.app.worker.redis_client import redis_client


# =========================
# OUTPUT
# =========================
def write_output(out_path: str, data: str):
    with open(out_path, "w", encoding="utf-8") as f:
        f.write((data or "").strip() + "\n")


def set_status(db, task_id: int, status: str):
    db.execute(
        update(Task)
        .where(Task.task_id == task_id)
        .values(status=status)
    )


# =========================
# CELERY ENTRY
# =========================
@celery.task
def generate_task_tests(task_id: int, time_limit: int, memory_limit: int):
    return _generate_task_tests(task_id, time_limit, memory_limit)


# =========================
# MAIN LOGIC
# =========================
def _generate_task_tests(task_id: int, time_limit: int, memory_limit: int):

    paths = get_task_paths(task_id)

    task_dir = paths["task_dir"]
    tests_dir = paths["tests_dir"]
    sol_dir = paths["sol_dir"]

    os.makedirs(tests_dir, exist_ok=True)
    os.makedirs(sol_dir, exist_ok=True)

    db = SessionLocal()

    try:
        # =========================
        # STATUS
        # =========================
        task = db.get(Task, task_id)
        if task:
            set_status(db, task_id, "RUNNING")
            db.commit()

        # =========================
        # SOLUTION
        # =========================
        solution_cpp = os.path.join(sol_dir, "solution.cpp")
        solution_py = os.path.join(sol_dir, "solution.py")

        solution_file = (
            solution_cpp if os.path.exists(solution_cpp)
            else solution_py
        )

        in_files = sorted(f for f in os.listdir(tests_dir) if f.endswith(".in"))

        results = []

        # =========================
        # COMPILE ONCE (CPP)
        # =========================
        if solution_file.endswith(".cpp"):

            key = f"compile:{task_id}:{file_hash(solution_cpp)}"

            if redis_client.set(key, "1", nx=True, ex=86400):
                try:
                    container = compile_cpp_container(
                        code_path=f"/app/solutions/{os.path.basename(solution_cpp)}",
                        workdir=task_dir,
                        memory_limit_mb=max(memory_limit, 1024)
                    )
                    container.wait()
                    container.remove(force=True)

                except Exception:
                    redis_client.delete(key)
                    raise

        # =========================
        # RUN TESTS
        # =========================
        for in_file in in_files:

            input_path = f"/app/tests/{in_file}"
            out_file = in_file.replace(".in", ".out")
            output_path = os.path.join(tests_dir, out_file)

            start = time.time()

            # =========================
            # EXECUTION
            # =========================
            if solution_file.endswith(".py"):

                result = run_with_limits(
                    run_python_container,
                    code_file=f"solutions/{os.path.basename(solution_file)}",
                    input_file=input_path,
                    workdir=task_dir,
                    time_limit_ms=time_limit,
                    memory_limit_mb=memory_limit
                )

            else:

                result = run_with_limits(
                    run_cpp_container,
                    input_file=in_file,
                    workdir=task_dir,
                    time_limit_ms=time_limit,
                    memory_limit_mb=memory_limit
                )

            output = result["output"]

            # =========================
            # WRITE OUTPUT
            # =========================
            write_output(output_path, output)

            results.append({
                "test": in_file,
                "out": out_file,
                "time_ms": result["time_ms"],
                "status": result["status"]
            })

        # =========================
        # FINAL STATUS
        # =========================
        set_status(db, task_id, "READY")
        db.commit()

        return results

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()