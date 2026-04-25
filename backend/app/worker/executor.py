import docker
import time
import os



from backend.app.worker.executor_docker import (
    compile_cpp_container,
    run_cpp_container,
    run_python_container
)

client = docker.from_env()



# =========================
# COMPILATION
# =========================

def compile_cpp(code_path: str, workdir: str, memory_limit_mb: int):

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
        stderr=True,
        stdout=True,
        remove=True
    )
    return container


# =========================
# PYTHON RUN
# =========================

def run_python(code_file, input_file, workdir, memory_limit_mb):
    workdir = os.path.abspath(workdir)

    return client.containers.run(
        image="python:3.11-slim",
        command=f"sh -c 'python {code_file} < {input_file}'",
        volumes={workdir: {"bind": "/app", "mode": "ro"}},
        working_dir="/app",
        network_disabled=True,
        mem_limit=f"{memory_limit_mb}m",
        detach=True,
        stdout=True,
        stderr=True,
        remove=False
    )


# =========================
# CPP RUN
# =========================

def run_cpp(input_file, workdir, memory_limit_mb):
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
        stdout=True,
        stderr=True,
        remove=False,
        detach=True  
    )

    
# =========================
# TIME + MEMORY LIMIT WRAPPER
# =========================

def run_with_limits(func, *, time_limit_ms: int, memory_limit_mb: int, **kwargs):

    start = time.time()
    container = None

    try:
        container = func(
            memory_limit_mb=memory_limit_mb,
            **kwargs
        )

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
                "time_ms": int((time.time() - start) * 1000)
            }

        logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="ignore")

        return {
            "status": "OK",
            "output": logs,
            "time_ms": int((time.time() - start) * 1000)
        }

    finally:
        if container:
            try:
                container.remove(force=True) 
            except:
                pass