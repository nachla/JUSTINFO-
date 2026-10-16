from fastapi import FastAPI

from core.middleware import setup_cors
from routers import ai, data

app = FastAPI(
    title="PROSADA API",
    description="Backend API Prosada: analitik inovasi daerah Jawa Timur (clustering, Knowledge Graph, Graph RAG)",
    version="1.0.0",
)

setup_cors(app)

app.include_router(data.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"message": "PROSADA API berjalan", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
