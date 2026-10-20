import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Maximize2,
  BrainCircuit,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { chatAi } from "../services/ai";

export default function ChatbotWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "init",
      role: "assistant",
      content:
        "Halo! Ada yang ingin ditanyakan seputar data inovasi dan Knowledge Graph Jawa Timur?",
      xai: {
        alur_penalaran: ["Model terhubung langsung ke Knowledge Graph Jawa Timur."],
        tingkat_keyakinan: "Tinggi",
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedXaiId, setExpandedXaiId] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Jangan tampilkan floating widget jika pengguna sedang di halaman penuh /ai-insight
  if (location.pathname === "/ai-insight") {
    return null;
  }

  async function handleSend(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: q,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await chatAi(q, nextHistory);
      const botMsg = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: res.jawaban || "Respon kosong.",
        xai: res.xai,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Maaf, terjadi kesalahan: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Jendela Chat Popup */}
      {isOpen && (
        <div className="mb-3 flex h-[520px] w-[350px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-[#cde0ed] bg-white shadow-2xl transition">
          {/* Header Popup */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#113d64] to-[#1a7a6e] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
                <Bot size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">JUSTINFO AI Chat</h4>
                <p className="text-[10px] text-emerald-200">Knowledge Graph & XAI Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/ai-insight");
                }}
                title="Buka Layar Penuh"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
              >
                <Maximize2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Isi Pesan Chat */}
          <div className="flex-1 overflow-y-auto bg-[#f8fbfe] p-3 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1a7a6e] text-white">
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
                    m.role === "user"
                      ? "bg-[#113d64] text-white rounded-tr-none"
                      : "bg-white border border-[#e2edf3] text-[#243746] rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Ringkasan XAI Mini */}
                  {m.xai && m.xai.alur_penalaran && m.xai.alur_penalaran.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-[#e5eff5]">
                      <button
                        onClick={() =>
                          setExpandedXaiId(expandedXaiId === m.id ? null : m.id)
                        }
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#1a7a6e] hover:underline cursor-pointer"
                      >
                        <BrainCircuit size={11} />
                        <span>Explainable AI</span>
                        {expandedXaiId === m.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>

                      {expandedXaiId === m.id && (
                        <div className="mt-1 space-y-1 rounded bg-[#eef7fa] p-1.5 text-[10px] text-[#243746]">
                          <p className="font-semibold text-[#113d64]">Alur Penalaran:</p>
                          {m.xai.alur_penalaran.map((step, idx) => (
                            <p key={idx} className="leading-tight">• {step}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#627d92]">
                <Bot size={14} className="text-[#1a7a6e] animate-spin" />
                <span className="text-[11px]">JUSTINFO AI sedang menganalisis Knowledge Graph...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Form Input Pesan */}
          <form
            onSubmit={handleSend}
            className="flex items-center border-t border-[#e2ecf2] bg-white p-2 gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan seputar inovasi..."
              disabled={loading}
              className="flex-1 rounded-xl border border-[#d8e7f1] bg-[#f9fcfe] px-2.5 py-1.5 text-xs text-[#113d64] outline-none focus:border-[#1a7a6e]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#113d64] text-white transition hover:bg-[#1a7a6e] disabled:opacity-40 cursor-pointer"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Tombol Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#113d64] via-[#145763] to-[#1a7a6e] p-3 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95 cursor-pointer"
        aria-label="Tanya AI Knowledge Graph"
      >
        <div className="relative">
          {isOpen ? <X size={22} /> : <Bot size={22} />}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
        </div>
        <span className="hidden font-semibold text-xs tracking-wide sm:inline pr-1">
          Tanya AI Jatim
        </span>
      </button>
    </div>
  );
}

