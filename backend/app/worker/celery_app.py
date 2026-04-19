from celery import Celery



celery = Celery(
    "judge",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
    include=["backend.app.worker.tasks"]
)

celery.conf.update(
    task_track_started=True,
    worker_prefetch_multiplier=1,  # важно для judge
    task_acks_late=True
)
