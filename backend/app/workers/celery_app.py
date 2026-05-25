from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "uiwiz",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
    include=["app.workers.generation_task"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
