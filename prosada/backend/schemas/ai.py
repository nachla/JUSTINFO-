from typing import Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    pertanyaan: str
    history: list[ChatMessage] = Field(default_factory=list)


class XaiEntity(BaseModel):
    tipe: str = "Entitas"
    nama: str
    keterangan: str | None = None


class XaiDetail(BaseModel):
    alur_penalaran: list[str] = Field(default_factory=list)
    entitas_graph: list[Any] = Field(default_factory=list)
    relasi_kunci: list[str] = Field(default_factory=list)
    faktor_penentu: list[str] = Field(default_factory=list)
    tingkat_keyakinan: str = "Tinggi (Terverifikasi Knowledge Graph)"
    grounded: bool = True


class ChatResponse(BaseModel):
    pertanyaan: str
    jawaban: str
    xai: XaiDetail
    evidence: list[str] = Field(default_factory=list)
    mode: str = "direct_api_kg"
    catatan: str | None = None


# Backwards compatibility untuk pemanggilan RAG sebelumnya
class RagRequest(BaseModel):
    pertanyaan: str
    pakai_genai: bool = True


class RagResponse(BaseModel):
    pertanyaan: str
    path: str
    evidence: list[str]
    jawaban: str
    grounded: bool
    mode: str  # "direct_api_kg" atau "template"
    catatan: str | None = None
    xai: XaiDetail | None = None


class StatusResponse(BaseModel):
    genai: bool
    model: str | None = None
    knowledge_graph: dict[str, Any] | None = None
