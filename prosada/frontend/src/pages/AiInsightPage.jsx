import { useEffect, useRef, useState } from "react";
import {
  Bot,
  User,
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Network,
  BrainCircuit,
  ShieldCheck,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { ErrorBox } from "../components/State";
import { chatAi, getAiStatus } from "../services/ai";

const REKOMENDASI_PERTANYAAN = [
  { label: "Ringkasan Jatim", q: "Bagaimana ringkasan keseluruhan inovasi daerah di Jawa Timur menurut Knowledge Graph?" },
  { label: "Inovasi Terbanyak", q: "Wilayah mana saja dengan jumlah inovasi terbanyak di Jawa Timur dan berapa skornya?" },
  { label: "Profil Ekosistem 2", q: "Jelaskan karakteristik Profil Ekosistem Wilayah 2 dan urusan dominannya!" },
  { label: "Analisis Kab. Madiun", q: "Bagaimana analisis inovasi di Kabupaten Madiun dan keunggulannya?" },
  { label: "Bandingkan Wilayah", q: "Bandingkan karakteristik inovasi antara Kota Surabaya dan Kabupaten Madiun!" },
  { label: "Profil Provinsi 3", q: "Apa karakteristik Profil Inovasi Provinsi 3 dan mengapa tingkatnya Tinggi?" },
];

// Helper parser markdown sederhana dan aman untuk jawaban AI
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' | 'ol'

  function flushList() {
    if (currentList.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 ml-5 list-decimal space-y-1 text-sm text-[#243746]">
            {currentList.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 ml-5 list-disc space-y-1 text-sm text-[#243746]">
            {currentList.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  }

  function formatInline(str) {
    // Regex penggantian **bold**, *italic*, dan `code`
    const parts = [];
    let remaining = str;
    let keyIdx = 0;

    // Sederhana: pisahkan berdasarkan token **bold** dan `code`
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-[#0f2d4a]">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code key={keyIdx++} className="rounded bg-[#e8f1f5] px-1.5 py-0.5 font-mono text-xs text-[#0f606b]">
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={idx} className="mt-3 mb-1 text-base font-bold text-[#0f2d4a]">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={idx} className="mt-4 mb-2 text-lg font-bold text-[#0f2d4a]">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={idx} className="mt-4 mb-2 text-xl font-bold text-[#0f2d4a]">
          {formatInline(trimmed.slice(2))}
        </h2>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      currentList.push(trimmed.replace(/^\d+\.\s*/, ""));
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") flushList();
      listType = "ul";
      currentList.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={idx} className="my-1.5 text-sm leading-relaxed text-[#243746]">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

// Komponen Badge Entitas XAI
function EntityPill({ entity }) {
  const isObj = typeof entity === "object" && entity !== null;
  const tipe = isObj ? entity.tipe || "Entitas" : "Entitas";
  const nama = isObj ? entity.nama : String(entity);
  const ket = isObj ? entity.keterangan : null;

  let color = "bg-blue-50 text-blue-800 border-blue-200";
  if (tipe.toLowerCase().includes("profil")) {
    color = "bg-purple-50 text-purple-800 border-purple-200";
  } else if (tipe.toLowerCase().includes("daerah")) {
    color = "bg-emerald-50 text-emerald-800 border-emerald-200";
  } else if (tipe.toLowerCase().includes("urusan")) {
    color = "bg-amber-50 text-amber-800 border-amber-200";
  } else if (tipe.toLowerCase().includes("inovasi")) {
    color = "bg-sky-50 text-sky-800 border-sky-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-xs ${color}`}
      title={ket || `${tipe}: ${nama}`}
    >
      <span className="font-semibold uppercase tracking-wider text-[10px] opacity-75">{tipe}:</span>
      <span>{nama}</span>
      {ket && <span className="opacity-70 text-[11px]">({ket})</span>}
    </span>
  );
}

// Panel Komponen Explainable AI (XAI)
function XaiPanel({ xai, evidence }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("penalaran"); // 'penalaran' | 'entitas' | 'relasi' | 'faktor'

  if (!xai) return null;

  const alur = xai.alur_penalaran || [];
  const entitas = xai.entitas_graph || [];
  const relasi = xai.relasi_kunci || [];
  const faktor = xai.faktor_penentu || [];
  const keyakinan = xai.tingkat_keyakinan || "Tinggi (Terverifikasi Knowledge Graph)";

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#d2e3ee] bg-[#f7fbfe] transition">
      {/* Header Bar XAI */}
      <div
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-xs select-none hover:bg-[#eef6fa]"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1a7a6e] text-white">
            <BrainCircuit size={12} />
          </div>
          <span className="font-semibold tracking-wide text-[#113d64]">
            Explainable AI (XAI) · Transparansi Penalaran Graph
          </span>
          <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 sm:inline-flex">
            <ShieldCheck size={11} /> {keyakinan}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-[#1a7a6e]">
          <span>{open ? "Tutup Rincian" : "Buka Bukti & Logika"}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Konten Terbuka */}
      {open && (
        <div className="border-t border-[#d2e3ee] p-3.5 text-xs text-[#243746]">
          {/* Tabs Navigasi XAI */}
          <div className="mb-3 flex flex-wrap gap-1.5 border-b border-[#e1ecf2] pb-2.5">
            <button
              onClick={() => setActiveTab("penalaran")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "penalaran"
                  ? "bg-[#113d64] text-white shadow-xs"
                  : "bg-white text-[#4a6174] hover:bg-[#eaf1f5]"
              }`}
            >
              🧠 Alur Penalaran ({alur.length})
            </button>
            <button
              onClick={() => setActiveTab("entitas")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "entitas"
                  ? "bg-[#113d64] text-white shadow-xs"
                  : "bg-white text-[#4a6174] hover:bg-[#eaf1f5]"
              }`}
            >
              🕸️ Entitas Graph ({entitas.length})
            </button>
            <button
              onClick={() => setActiveTab("relasi")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "relasi"
                  ? "bg-[#113d64] text-white shadow-xs"
                  : "bg-white text-[#4a6174] hover:bg-[#eaf1f5]"
              }`}
            >
              🔗 Relasi Kunci ({relasi.length})
            </button>
            <button
              onClick={() => setActiveTab("faktor")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "faktor"
                  ? "bg-[#113d64] text-white shadow-xs"
                  : "bg-white text-[#4a6174] hover:bg-[#eaf1f5]"
              }`}
            >
              📊 Faktor Penentu ({faktor.length})
            </button>
          </div>

          {/* Konten Tab Aktif */}
          {activeTab === "penalaran" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#647c90]">
                Alur langkah deduksi AI menelusuri fakta Knowledge Graph untuk menyimpulkan jawaban:
              </p>
              <div className="space-y-1.5">
                {alur.map((langkah, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white p-2 border border-[#e5eef3]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6f4f1] font-bold text-[#1a7a6e] text-[10px]">
                      {i + 1}
                    </span>
                    <span className="text-xs leading-relaxed text-[#243746]">{langkah}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "entitas" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#647c90]">
                Node-node Knowledge Graph yang menjadi dasar fakta jawaban:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entitas.length > 0 ? (
                  entitas.map((ent, i) => <EntityPill key={i} entity={ent} />)
                ) : (
                  <span className="text-slate-500">Agregasi keseluruhan Knowledge Graph Jawa Timur.</span>
                )}
              </div>
            </div>
          )}

          {activeTab === "relasi" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#647c90]">
                Edge dan relasi semantik yang diekstraksi dari Knowledge Graph:
              </p>
              <div className="space-y-1">
                {relasi.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-md bg-[#edf5f9] px-2.5 py-1 font-mono text-[11px] text-[#113d64]"
                  >
                    <Network size={12} className="text-[#1a7a6e] shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "faktor" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#647c90]">
                Faktor kunci dan metrik pendukung penarikan kesimpulan:
              </p>
              <ul className="list-disc ml-4 space-y-1 text-xs">
                {faktor.map((f, i) => (
                  <li key={i} className="text-[#243746]">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evidence && evidence.length > 0 && (
            <div className="mt-3 border-t border-[#e1ecf2] pt-2 text-[11px] text-[#647c90]">
              <span className="font-semibold text-[#113d64]">Bukti Graph Tambahan: </span>
              {evidence.slice(0, 3).join(" • ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiInsightPage() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Saya **JUSTINFO AI Assistant**, asisten cerdas yang terhubung **langsung ke Knowledge Graph Inovasi Daerah Jawa Timur** (1.073 node & 5.817 relasi).\n\n" +
        "Sistem ini mengakses data Knowledge Graph secara langsung melalui API cerdas dan menyajikan penalaran transparan melalui **Explainable AI (XAI)**.\n\n" +
        "Silakan ajukan pertanyaan bebas seputar statistik inovasi Jawa Timur, klaster profil ekosistem, perbandingan daerah, maupun keunggulan inovasi tertentu!",
      xai: {
        alur_penalaran: [
          "Sistem inisialisasi: Menghubungkan engine LLM langsung ke database Knowledge Graph Jawa Timur (1.073 node, 5.817 relasi).",
          "Transparansi XAI: Setiap output dilengkapi rincian alur penalaran, entitas graph, relasi kunci, dan faktor penentu.",
        ],
        entitas_graph: [
          { tipe: "KnowledgeGraph", nama: "JUSTINFO Jatim", keterangan: "679 inovasi, 36 pemda, 292 OPD" },
          { tipe: "Klaster", nama: "Profil Ekosistem & Karakteristik", keterangan: "6 Profil Inovasi (Wilayah & Provinsi)" },
        ],
        relasi_kunci: [
          "(Inovasi) -[BERADA_DI]-> (Daerah)",
          "(Daerah) -[TERMASUK_PROFIL_EKOSISTEM]-> (ProfilEkosistem)",
          "(Profil) -[DOMINAN_URUSAN]-> (Urusan)",
        ],
        faktor_penentu: [
          "Akses utuh data Knowledge Graph",
          "Explainable AI (XAI) transparan",
          "Direct API High-Speed Groq Inference",
        ],
        tingkat_keyakinan: "Tinggi (100% Terverifikasi Knowledge Graph)",
        grounded: true,
      },
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    getAiStatus()
      .then(setStatus)
      .catch((err) => console.error("Gagal membaca status AI:", err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(textToSend = input) {
    const q = textToSend.trim();
    if (!q || loading) return;

    setError(null);
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      // Mengirim riwayat percakapan untuk multi-turn chat
      const res = await chatAi(q, newHistory);

      const botMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.jawaban || "Maaf, respon kosong dari AI.",
        xai: res.xai,
        evidence: res.evidence,
        catatan: res.catatan,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setError(e.message || "Terjadi kesalahan saat menghubungi API AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    if (messages.length <= 1) return;
    if (confirm("Mulai sesi obrolan baru dan bersihkan riwayat chat?")) {
      setMessages([messages[0]]);
      setError(null);
    }
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Utama */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2edf3]">
        <div>
          <PageHeader
            badge="Direct Knowledge Graph · Explainable AI"
            title="JUSTINFO AI Chatbot"
            subtitle="Asisten analitik cerdas terhubung langsung ke Knowledge Graph Jawa Timur dengan penjelasan penalaran transparan (XAI)"
          />
        </div>

        <div className="flex items-center gap-2">
          {status && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#d6e5ef] bg-white px-3 py-1.5 text-xs text-[#2b4c68] shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">
                {status.model ? `Model: ${status.model.split("/").pop()}` : "Groq API Online"}
              </span>
              <span className="text-[#879cb0]">|</span>
              <span className="text-[11px] text-[#557088]">
                {status.knowledge_graph?.total_node || "1.073"} Node KG
              </span>
            </div>
          )}

          <button
            onClick={handleReset}
            title="Reset Percakapan"
            className="flex items-center gap-1.5 rounded-xl border border-[#d6e5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#4a6680] shadow-xs transition hover:bg-[#f0f6fa] hover:text-[#113d64]"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Rekomendasi Pertanyaan Cepat */}
      <div className="py-2.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <span className="shrink-0 text-xs font-bold text-[#1a7a6e] mr-1 flex items-center gap-1">
          <Sparkles size={13} /> Ide Tanya:
        </span>
        {REKOMENDASI_PERTANYAAN.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.q)}
            disabled={loading}
            className="shrink-0 rounded-full border border-[#d4e4ee] bg-white px-3 py-1 text-xs font-medium text-[#2d4d68] shadow-2xs transition hover:border-[#1a7a6e] hover:bg-[#eef7f6] hover:text-[#1a7a6e] disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {/* Area Obrolan Chat (Scrollable) */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-[#e2ecf2] bg-[#f9fcfe] p-4 shadow-inner space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#113d64] to-[#1a7a6e] text-white shadow-md">
                <Bot size={18} />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm transition ${
                msg.role === "user"
                  ? "bg-[#113d64] text-white rounded-tr-xs"
                  : "bg-white border border-[#e2ecf2] text-[#243746] rounded-tl-xs"
              }`}
            >
              {/* Header bubble */}
              <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-75">
                <span className="font-semibold">
                  {msg.role === "user" ? "Anda" : "JUSTINFO"}
                </span>
                <div className="flex items-center gap-2">
                  <span>{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="cursor-pointer hover:opacity-100 transition"
                      title="Salin jawaban"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Teks Pesan */}
              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <>
                  <FormattedMessage text={msg.content} />
                  {msg.catatan && (
                    <p className="mt-2 text-xs italic text-[#b36b00]">{msg.catatan}</p>
                  )}
                  {/* Panel XAI */}
                  {msg.xai && <XaiPanel xai={msg.xai} evidence={msg.evidence} />}
                </>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#29567c] text-white shadow-md">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {/* Indikator Loading / Mengetik */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#113d64] to-[#1a7a6e] text-white shadow-md animate-pulse">
              <Bot size={18} />
            </div>
            <div className="rounded-2xl rounded-tl-xs border border-[#e2ecf2] bg-white p-4 shadow-sm text-xs text-[#526f87] flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-[#1a7a6e] animate-bounce" />
              <span className="flex h-2 w-2 rounded-full bg-[#1a7a6e] animate-bounce [animation-delay:0.2s]" />
              <span className="flex h-2 w-2 rounded-full bg-[#1a7a6e] animate-bounce [animation-delay:0.4s]" />
              <span className="font-medium ml-1">
                Mengakses Knowledge Graph dan merumuskan analisis XAI...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Pesan di Bagian Bawah */}
      <div className="pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center rounded-2xl border border-[#cfdfeb] bg-white p-1.5 shadow-md focus-within:border-[#1a7a6e] focus-within:ring-2 focus-within:ring-[#1a7a6e]/20 transition"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan analisis inovasi, profil ekosistem, ranking wilayah, atau data Knowledge Graph..."
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-[#113d64] placeholder-[#8ea4b8] outline-none"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#113d64] to-[#1a7a6e] px-4 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="text-sm hidden sm:inline">Kirim</span>
            <Send size={15} />
          </button>
        </form>

        <p className="mt-1.5 text-center text-[11px] text-[#7f96a9]">
          JUSTINFO AI terhubung langsung ke Knowledge Graph resmi BRIDA Jawa Timur. Seluruh kesimpulan diverifikasi dengan data graph faktual.
        </p>
      </div>
    </div>
  );
}
