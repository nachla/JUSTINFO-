from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings


def setup_cors(app: FastAPI) -> None:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    origins_set = set(default_origins)
    if settings.FRONTEND_URL:
        for u in settings.FRONTEND_URL.split(","):
            cleaned = u.strip().rstrip("/")
            if cleaned:
                origins_set.add(cleaned)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(origins_set) if "*" not in origins_set else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
