import configparser
import os
from pathlib import Path


class Settings:
    def __init__(self):
        self.config = configparser.ConfigParser()
        config_path = Path(__file__).parent.parent.parent / "config.properties"
        self.config.read(config_path)

    # Database
    @property
    def database_url(self) -> str:
        return self.config.get("database", "url", fallback=os.getenv("DATABASE_URL", ""))

    @property
    def pool_size(self) -> int:
        return self.config.getint("database", "pool_size", fallback=10)

    # Redis
    @property
    def redis_url(self) -> str:
        return self.config.get("redis", "url", fallback=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    @property
    def celery_broker(self) -> str:
        return self.config.get("redis", "celery_broker", fallback=self.redis_url)

    @property
    def celery_backend(self) -> str:
        return self.config.get("redis", "celery_backend", fallback="redis://localhost:6379/1")

    # Firebase
    @property
    def firebase_project_id(self) -> str:
        return self.config.get("firebase", "project_id", fallback=os.getenv("FIREBASE_PROJECT_ID", ""))

    @property
    def firebase_credentials_path(self) -> str:
        return self.config.get("firebase", "credentials_path", fallback="./firebase-service-account.json")

    # Security
    @property
    def secret_key(self) -> str:
        return self.config.get("security", "secret_key", fallback=os.getenv("SECRET_KEY", ""))

    # App
    @property
    def debug(self) -> bool:
        return self.config.getboolean("app", "debug", fallback=False)

    @property
    def cors_origins(self) -> str:
        return self.config.get("app", "cors_origins", fallback="http://localhost:3000")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
