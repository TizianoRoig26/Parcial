import time
import uuid
from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logger import get_logger

logger = get_logger("app.middleware.logging")


class LoggingMiddleware(BaseHTTPMiddleware):
    EXCLUDED_PATHS: set[str] = {
        "/health",
        "/favicon.ico",
        "/openapi.json",
        "/docs",
        "/redoc",
    }

    LOGIN_PATH = "/api/v1/auth/token"
    MAX_FAILED_ATTEMPTS = 5
    BLOCK_SECONDS = 30
    WINDOW_SECONDS = 900

    _attempts_by_ip: dict[str, list[float]] = {}
    _blocked_until: dict[str, float] = {}

    def __init__(self, app: ASGIApp, log_body: bool = False) -> None:
        super().__init__(app)
        self.log_body = log_body

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        request.state.request_id = request_id

        if request.url.path == self.LOGIN_PATH and request.method == "POST":
            client_ip = self._get_client_ip(request)
            retry_after = self._get_retry_after(client_ip)
            
            if retry_after is not None:
                response = Response(
                    content='{"detail":"Demasiados intentos de login. Espera antes de volver a intentar."}',
                    status_code=429,
                    media_type="application/json",
                )
                response.headers["Retry-After"] = str(retry_after)
                response.headers["X-Request-ID"] = request_id
                logger.warning(
                    "Login bloqueado para %s [id=%s] retry_after=%ss",
                    client_ip,
                    request_id,
                    retry_after,
                )
                return response

        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        logger.info(
            "→ %s %s [id=%s] from=%s ua=%s",
            request.method,
            request.url.path,
            request_id,
            self._get_client_ip(request),
            request.headers.get("user-agent", "unknown"),
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "✗ %s %s [id=%s] EXCEPTION after %.1fms: %s",
                request.method,
                request.url.path,
                request_id,
                duration_ms,
                repr(exc),
            )
            raise

        duration_ms = (time.perf_counter() - start_time) * 1000

        if response.status_code >= 500:
            log_level = logger.error
        elif response.status_code >= 400:
            log_level = logger.warning
        else:
            log_level = logger.info

        if request.url.path == self.LOGIN_PATH and request.method == "POST":
            client_ip = self._get_client_ip(request)
            if response.status_code == 401:
                self._register_failure(client_ip)
            elif 200 <= response.status_code < 300:
                self._clear_attempts(client_ip)

        log_level(
            "← %s %s [id=%s] %d in %.1fms",
            request.method,
            request.url.path,
            request_id,
            response.status_code,
            duration_ms,
        )

        response.headers["X-Request-ID"] = request_id

        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _get_retry_after(self, client_ip: str) -> int | None:
        now = time.monotonic()
        blocked_until = self._blocked_until.get(client_ip)
        if blocked_until is None:
            return None

        if blocked_until <= now:
            self._blocked_until.pop(client_ip, None)
            return None

        return max(1, int(blocked_until - now) + 1)

    def _register_failure(self, client_ip: str) -> None:
        now = time.monotonic()
        attempts = self._attempts_by_ip.get(client_ip, [])
        cutoff = now - self.WINDOW_SECONDS

        attempts = [t for t in attempts if t >= cutoff]
        attempts.append(now)
        
        self._attempts_by_ip[client_ip] = attempts

        if len(attempts) >= self.MAX_FAILED_ATTEMPTS:
            self._blocked_until[client_ip] = now + self.BLOCK_SECONDS

    def _clear_attempts(self, client_ip: str) -> None:
        self._attempts_by_ip.pop(client_ip, None)
        self._blocked_until.pop(client_ip, None)