import docker
import os

client = docker.from_env()


# =========================
# COMPILE (CPP)
# =========================
def compile_cpp_container(code_path: str, workdir: str, memory_limit_mb: int):
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
        stdout=True,
        stderr=True,
        detach=True,
        remove=False
    )

    return container


# =========================
# RUN CPP
# =========================
def run_cpp_container(input_file: str, workdir: str, memory_limit_mb: int, **_):
    workdir = os.path.abspath(workdir)

    container = client.containers.run(
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
        detach=True,
        remove=False
    )

    return container


# =========================
# RUN PYTHON
# =========================
def run_python_container(code_file: str, input_file: str, workdir: str, memory_limit_mb: int, **_):
    workdir = os.path.abspath(workdir)

    container = client.containers.run(
        image="python:3.11-slim",
        command=f"sh -c 'python {code_file} < {input_file}'",
        volumes={workdir: {"bind": "/app", "mode": "ro"}},
        working_dir="/app",
        network_disabled=True,
        mem_limit=f"{memory_limit_mb}m",
        stdout=True,
        stderr=True,
        detach=True,
        remove=False
    )

    return container