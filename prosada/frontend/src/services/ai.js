import { apiFetch } from "./api";

export const getAiStatus = () => apiFetch("/ai/status");

export const askRag = (pertanyaan, pakaiGenai = true) =>
  apiFetch("/ai/rag", {
    method: "POST",
    body: JSON.stringify({ pertanyaan, pakai_genai: pakaiGenai }),
  });

export const chatAi = (pertanyaan, history = []) =>
  apiFetch("/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      pertanyaan,
      history: history.map((h) => ({ role: h.role, content: h.content })),
    }),
  });
