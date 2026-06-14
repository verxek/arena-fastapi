import docker
import time
import os

client = docker.from_env()


# =========================
# COMPILATION (C++)
# =========================
def compile_cpp(code_path: str, workdir: str, memory_limit_mb: int):
    """Компилирует C++ код в изолированном контейнере"""
    workdir = os.path.abspath(workdir)
    build_dir = os.path.join(workdir, "build")
    os.makedirs(build_dir, exist_ok=True)

    container = client.containers.run(
        image="gcc:latest",
        command=f"g++ {code_path} -O2 -std=c++17 -o /build/a.out",
        volumes={
            workdir: {"bind": "/app", "mode": "ro"},
            build_dir: {"bind": "/build", "mode": "rw"},
        },
        working_dir="/app",
        network_disabled=True,
        mem_limit=f"{memory_limit_mb}m",
        security_opt=["no-new-privileges"], 
        stdout=True,
        stderr=True,
        detach=True,
        remove=False  
    )
    return container


# =========================
# RUN PYTHON
# =========================
def run_python(code_file: str, input_file: str, workdir: str, memory_limit_mb: int):
    """Запускает Python-решение в изолированном контейнере"""
    workdir = os.path.abspath(workdir)

    return client.containers.run(
        image="python:3.11-slim",
        command=f"sh -c 'python {code_file} < {input_file}'",
        volumes={workdir: {"bind": "/app", "mode": "ro"}},
        working_dir="/app",
        network_disabled=True,
        mem_limit=f"{memory_limit_mb}m",
        security_opt=["no-new-privileges"],
        stdout=True,
        stderr=True,
        detach=True,
        remove=False
    )


# =========================
# RUN C++
# =========================
def run_cpp(input_file: str, workdir: str, memory_limit_mb: int):
    """Запускает скомпилированный C++ бинарник в изолированном контейнере"""
    workdir = os.path.abspath(workdir)

    return client.containers.run(
        image="gcc:latest",
        command=f"sh -c '/build/a.out < /app/tests/{os.path.basename(input_file)}'",
        volumes={
            workdir: {"bind": "/app", "mode": "ro"},
            os.path.join(workdir, "build"): {"bind": "/build", "mode": "rw"},
        },
        working_dir="/app",
        network_disabled=True,
        mem_limit=f"{memory_limit_mb}m",
        security_opt=["no-new-privileges"],
        stdout=True,
        stderr=True,
        detach=True,
        remove=False
    )


# =========================
# WRAPPER: TIME + MEMORY LIMITS
# =========================
def run_with_limits(func, *, time_limit_ms: int, memory_limit_mb: int, **kwargs):
    """
    Запускает функцию с ограничениями по времени и памяти.
    Возвращает dict: {status, output, time_ms, memory_kb}
    """
    start = time.time()
    container = None

    try:
        container = func(memory_limit_mb=memory_limit_mb, **kwargs)

        try:
            container.wait(timeout=time_limit_ms / 1000)
        except Exception:
            try:
                container.kill()
                container.wait()
            except:
                pass
            return {
                "status": "TLE",
                "output": "",
                "time_ms": int((time.time() - start) * 1000),
                "memory_kb": 0
            }

        memory_kb = 0
        try:
            stats = container.stats(stream=False)
            usage = stats.get('memory_stats', {}).get('usage')
            if usage:
                memory_kb = int(usage / 1024)  
        except:
            pass  

        logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="ignore")

        return {
            "status": "OK",
            "output": logs,
            "time_ms": int((time.time() - start) * 1000),
            "memory_kb": memory_kb
        }

    finally:
        if container:
            try:
                container.remove(force=True)
            except:
                pass