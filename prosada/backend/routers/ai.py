from fastapi import APIRouter

from core.config import settings
from schemas.ai import ChatRequest, ChatResponse, RagRequest, RagResponse, StatusResponse
from services import ai_service, data_service as ds

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/status", response_model=StatusResponse)
def status():
    kg_meta = ds.get_kg()
    ringkasan = ds.get_ringkasan()
    return {
        "genai": bool(ai_service.kunci()),
        "model": settings.GROQ_MODEL,
        "knowledge_graph": {
            "total_node": kg_meta["total_node"],
            "total_relasi": kg_meta["total_relasi"],
            "total_inovasi": ringkasan["inovasi"],
            "total_pemda": ringkasan["pemda"],
        },
    }


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    history_dicts = [{"role": h.role, "content": h.content} for h in body.history]
    return ai_service.chat(body.pertanyaan, history_dicts)


@router.post("/rag", response_model=RagResponse)
def rag(body: RagRequest):
    return ai_service.jawab(body.pertanyaan, body.pakai_genai)
