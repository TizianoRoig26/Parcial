# app/core/config.py
from typing import Literal, Optional

from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ─── PostgreSQL ──────────────────────────────────────────────────────────
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str 
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """
        Construye la URL de conexión a PostgreSQL.
        Para tests se sobreescribe con SQLite en memoria desde conftest.py.
        """
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ─── JWT ──────────────────────────────────────────────────────────────────
    SECRET_KEY: str                    # Obligatorio — sin default. Mínimo 32 chars.
    ALGORITHM:  str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ───── Cloudinary ─────
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY:    Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # ───── MercadoPago ─────
    MP_ACCESS_TOKEN:  Optional[str] = None
    MP_PUBLIC_KEY:    Optional[str] = None
    MP_WEBHOOK_URL:   Optional[str] = None
    NGROK_URL:        Optional[str] = None
    FRONTEND_CLIENTE_URL: str = "http://localhost:5174"

    # ───── Rate Limiting ─────
    rate_limit_default_burst: int = 60
    rate_limit_default_per_minute: int = 60
    rate_limit_auth_burst: int = 5
    rate_limit_auth_per_minute: int = 5

    model_config = {
        "env_file":          ".env",
        "env_file_encoding": "utf-8",
        "extra":             "ignore",   # ignora vars extra del .env (ej. DATABASE_URL literal)
    }

LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"


# Instancia global — importar desde aquí en toda la app
settings = Settings()