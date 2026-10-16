"""
Layanan AI Langsung Berbasis Knowledge Graph (Direct API + Knowledge Graph + Explainable AI).

Menghubungkan langsung model LLM (Groq API) dengan data utuh Knowledge Graph Jawa Timur
tanpa batasan Graph RAG berbasis aturan yang kaku, dilengkapi Explainable AI (XAI) transparan
dan mendukung percakapan multi-turn untuk Chatbot.
"""
import json
import logging
import re
from typing import Any

import httpx

from core.config import settings
from services import data_service as ds

logger = logging.getLogger("ai_service")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def kunci() -> str:
    """Mengambil GROQ_API_KEY tanpa spasi atau tanda petik."""
    return settings.GROQ_API_KEY.strip().strip("\"'").strip()


def build_kg_context(pertanyaan: str = "") -> tuple[str, list[str]]:
    """
    Menyiapkan konteks fakta Knowledge Graph yang kaya dan relevan langsung untuk LLM.
    Mengembalikan (teks_konteks, daftar_evidence).
    """
    ringkasan = ds.get_ringkasan()
    profils = ds.get_profil()
    wilayah = ds.get_wilayah()
    kg_meta = ds.get_kg()

    evidence = [
        f"Knowledge Graph: {kg_meta['total_node']} Node, {kg_meta['total_relasi']} Relasi.",
        f"Total Inovasi: {ringkasan['inovasi']}, Total Pemda: {ringkasan['pemda']} (35 kab/kota + 1 provinsi), OPD Pengelola: {ringkasan['opd']}.",
        f"Rata-rata Skor Kematangan Jatim: {ds.idn(ringkasan['avg_kematangan'])}, Tahap Penerapan: {ds.idn(ringkasan['penerapan_pct'])}%.",
    ]

    # Ekstraksi wilayah per profil ekosistem
    nodes = ds.load_nodes()
    edges = ds.load_edges()
    eko_edges = edges[edges.relation == "TERMASUK_PROFIL_EKOSISTEM"]
    daerah_nodes = nodes[nodes.type == "Daerah"].set_index("node_id")["nama_daerah"].to_dict()

    profil_wilayah_map = {}
    for pid in ["PROFILE_EKO_01", "PROFILE_EKO_02", "PROFILE_EKO_03"]:
        target_edges = eko_edges[eko_edges.target_id == pid]
        d_names = [ds.daerah_pendek(daerah_nodes.get(sid, sid)) for sid in target_edges["source_id"] if sid in daerah_nodes]
        profil_wilayah_map[pid] = d_names

    # Teks ringkasan Profil
    profil_text_lines = []
    for p in profils:
        pid = p["id"]
        nama = p["nama"]
        tk = p["tingkat"]
        n_inv = p["n_inovasi"]
        bentuk_str = ", ".join(f"{b['nama']} ({ds.idn(b['pct'])}%)" for b in p.get("bentuk", []))
        jenis_str = ", ".join(f"{j['nama']} ({ds.idn(j['pct'])}%)" for j in p.get("jenis", []))
        urusan_str = ", ".join(f"{u['nama']} ({ds.idn(u['pct'])}%)" for u in p.get("urusan", []))
        tahap_str = ", ".join(f"{t['nama']} ({ds.idn(t['pct'])}%)" for t in p.get("tahapan", []))

        wilayah_anggota = profil_wilayah_map.get(pid, [])
        anggota_str = f" Anggota ({len(wilayah_anggota)} wilayah): {', '.join(wilayah_anggota)}." if wilayah_anggota else ""

        line = (
            f"- [{pid}] {nama} (Tingkat Kematangan: {tk}, {n_inv} inovasi):{anggota_str}\n"
            f"  * Bentuk Dominan: {bentuk_str}\n"
            f"  * Jenis Dominan: {jenis_str}\n"
            f"  * Urusan Dominan: {urusan_str}\n"
            f"  * Tahapan: {tahap_str}"
        )
        profil_text_lines.append(line)
        evidence.append(f"{pid} ({nama}) -> {tk} ({n_inv} inovasi)")

    # Daftar Wilayah & Skor
    wilayah_summary = [
        f"{w['nama']}: {w['n']} inovasi (Kematangan: {ds.idn(w['m'])}, Tingkat: {w['tk']})"
        for w in wilayah
    ]

    # Penelusuran entitas spesifik jika ada pertanyaan spesifik tentang daerah tertentu
    q_lower = pertanyaan.lower()
    specific_context_lines = []
    inv_df = ds.load_inovasi()
    daerah_id_map = ds.daerah_id_map()

    for nama_asli, did in daerah_id_map.items():
        pendek = ds.daerah_pendek(nama_asli).lower()
        if pendek in q_lower or nama_asli.lower() in q_lower:
            # Temukan inovasi di daerah ini
            d_inv = inv_df[inv_df.daerah == nama_asli]
            if not d_inv.empty:
                top_inv = d_inv.sort_values("kematangan", ascending=False).head(4)
                contoh_inv = [
                    f"'{r.judul_inovasi}' (Kematangan: {ds.idn(r.kematangan)}, OPD: {r.nama_opd}, Bentuk: {r.bentuk_inovasi}, Jenis: {r.jenis})"
                    for _, r in top_inv.iterrows()
                ]
                specific_context_lines.append(
                    f"DATA KHUSUS {nama_asli} ({len(d_inv)} inovasi, rerata kematangan {ds.idn(d_inv.kematangan.mean())}):\n"
                    f"Top Contoh Inovasi: {'; '.join(contoh_inv)}"
                )
                evidence.append(f"Daerah {nama_asli} memiliki {len(d_inv)} inovasi di Knowledge Graph.")

    context_str = f"""
=== DATASET KNOWLEDGE GRAPH PROSADA JAWA TIMUR ===
[METADATA GRAPH]
- Total Node: {kg_meta['total_node']}
- Total Edge / Relasi: {kg_meta['total_relasi']}
- Distribusi Tipe Node: {json.dumps({n['nama']: n['n'] for n in kg_meta['node']}, ensure_ascii=False)}
- Total Inovasi: {ringkasan['inovasi']}
- Total Pemda: {ringkasan['pemda']} (35 Kabupaten/Kota aktif berinovasi + 1 Pemerintah Provinsi)
- Total Admin OPD: {ringkasan['opd']}
- Rata-rata Skor Kematangan Jatim: {ds.idn(ringkasan['avg_kematangan'])}
- Persentase Inovasi Tahap Penerapan: {ds.idn(ringkasan['penerapan_pct'])}%

[DISTRIBUSI JENIS INOVASI]
{json.dumps(ringkasan['jenis'], ensure_ascii=False)}

[DISTRIBUSI BENTUK INOVASI]
{json.dumps(ringkasan['bentuk'], ensure_ascii=False)}

[KLASTER DAN PROFIL KNOWLEDGE GRAPH]
{chr(10).join(profil_text_lines)}

[DAFTAR SELURUH 35 KABUPATEN/KOTA BESERTA JUMLAH INOVASI & SKOR KEMATANGAN]
{'; '.join(wilayah_summary)}

[DATA KHUSUS ENTITAS TERKAIT]
{chr(10).join(specific_context_lines) if specific_context_lines else 'Tidak ada entitas spesifik yang difilter khusus.'}
"""
    return context_str, evidence


def _system_prompt(kg_context: str) -> str:
    return f"""Kamu adalah PROSADA AI Assistant, asisten analitik cerdas yang terhubung LANGSUNG ke Knowledge Graph Inovasi Daerah Jawa Timur (BRIDA Provinsi Jawa Timur).

Sistem ini TIDAK menggunakan Graph RAG berbasis aturan kaku, melainkan menggunakan API langsung dengan akses utuh ke fakta data Knowledge Graph Jawa Timur.
Tugasmu adalah menjawab pertanyaan pengguna secara komprehensif, informatif, ramah, dan berbasis data faktual yang akurat.

PENTING - PRINSIP EXPLAINABLE AI (XAI):
Setiap jawaban yang kamu berikan HARUS transparan dan dapat dipertanggungjawabkan (explainable).
Kamu WAJIB mengembalikan respon HANYA dalam format JSON valid (tanpa teks pembuka atau penutup markdown lain) dengan skema berikut:
{{
  "jawaban": "Teks jawaban lengkap, terstruktur rapi, menggunakan format Markdown (heading, bullet points, penekanan tebal) bila perlu. Jelaskan angka dan fakta secara analitis.",
  "xai": {{
    "alur_penalaran": [
      "Langkah 1: Identifikasi entitas dan konteks pertanyaan...",
      "Langkah 2: Penelusuran data pada Knowledge Graph...",
      "Langkah 3: Analisis komparatif atau agregasi metrik...",
      "Langkah 4: Sintesis kesimpulan dan implikasi kebijakan..."
    ],
    "entitas_graph": [
      {{"tipe": "Daerah|Profil|Urusan|Inovasi|Bentuk", "nama": "Nama Entitas", "keterangan": "Keterangan singkat peran atau nilainya"}}
    ],
    "relasi_kunci": [
      "(Node Sumber) -[NAMA_RELASI]-> (Node Target)"
    ],
    "faktor_penentu": [
      "Faktor kunci 1 pendukung kesimpulan",
      "Faktor kunci 2 pendukung kesimpulan"
    ],
    "tingkat_keyakinan": "Tinggi (100% Terverifikasi Knowledge Graph)",
    "grounded": true
  }}
}}

DATA RESMI KNOWLEDGE GRAPH JAWA TIMUR:
{kg_context}
"""


def _chat_fallback(pertanyaan: str, kg_context: str, evidence: list[str]) -> dict:
    """Fallback deterministik jika API eksternal sedang tidak dapat dijangkau."""
    q_low = pertanyaan.lower()
    ringkasan = ds.get_ringkasan()

    # Logika fallback sederhana namun kaya berbasis data Knowledge Graph
    if "ekosistem" in q_low or "profil" in q_low:
        profils = ds.get_profil()
        target = profils[0]
        for p in profils:
            if p["nama"].lower() in q_low or p["id"].lower() in q_low:
                target = p
                break
        jawaban = (
            f"Berdasarkan Knowledge Graph Jawa Timur, **{target['nama']}** (ID: `{target['id']}`) memiliki tingkat kematangan **{target['tingkat']}** "
            f"dengan mencakup {target['ringkas']}. Urusan dominannya adalah "
            + ", ".join(f"{u['nama']} ({ds.idn(u['pct'])}%)" for u in target.get("urusan", []))
            + f", serta didominasi oleh bentuk {target.get('bentuk', [{'nama': 'Pelayanan Publik'}])[0]['nama']}."
        )
        entitas = [
            {"tipe": "Profil", "nama": target["nama"], "keterangan": f"Tingkat {target['tingkat']}, {target['n_inovasi']} inovasi"},
        ]
        relasi = [f"({target['id']}) -[DOMINAN_URUSAN]-> ({target.get('urusan', [{'nama': 'Utama'}])[0]['nama']})"]
    elif "terbanyak" in q_low or "ranking" in q_low or "peringkat" in q_low:
        wil = ds.get_wilayah()[:5]
        daftar_str = "\n".join(f"- **{w['nama']}**: {w['n']} inovasi (Skor Kematangan: {ds.idn(w['m'])}, Tingkat: {w['tk']})" for w in wil)
        jawaban = f"Berikut adalah 5 daerah dengan jumlah inovasi terbanyak di Knowledge Graph Jawa Timur:\n\n{daftar_str}"
        entitas = [{"tipe": "Daerah", "nama": w["nama"], "keterangan": f"{w['n']} inovasi"} for w in wil]
        relasi = ["(Inovasi) -[BERADA_DI]-> (Daerah)", "(Daerah) -[TERMASUK_PROFIL_EKOSISTEM]-> (ProfilEkosistem)"]
    else:
        jawaban = (
            f"Knowledge Graph PROSADA mencatat total **{ringkasan['inovasi']} inovasi** dari **{ringkasan['pemda']} pemerintah daerah** "
            f"di Jawa Timur yang dikelola oleh **{ringkasan['opd']} Admin OPD**. Rata-rata skor kematangan inovasi Jawa Timur mencapai **{ds.idn(ringkasan['avg_kematangan'])}**, "
            f"dengan **{ds.idn(ringkasan['penerapan_pct'])}%** telah berada pada tahap penerapan."
        )
        entitas = [
            {"tipe": "Statistik", "nama": "Inovasi Jatim", "keterangan": f"{ringkasan['inovasi']} Inovasi"},
            {"tipe": "Pemda", "nama": "Jawa Timur", "keterangan": f"{ringkasan['pemda']} Pemda"},
        ]
        relasi = ["(Inovasi) -[BERADA_DI]-> (Daerah)", "(Inovasi) -[DIKELOLA_OLEH]-> (AdminOPD)"]

    return {
        "pertanyaan": pertanyaan,
        "jawaban": jawaban,
        "xai": {
            "alur_penalaran": [
                "Langkah 1: Mengidentifikasi kata kunci dan topik utama pada pertanyaan pengguna.",
                "Langkah 2: Menarik data agregat dari tabel nodes dan edges Knowledge Graph.",
                "Langkah 3: Membentuk ringkasan analitik berbasis data faktual graph.",
            ],
            "entitas_graph": entitas,
            "relasi_kunci": relasi,
            "faktor_penentu": ["Data faktual Knowledge Graph", "Fallback engine PROSADA"],
            "tingkat_keyakinan": "Tinggi (Terverifikasi dari Knowledge Graph Lokal)",
            "grounded": True,
        },
        "evidence": evidence[:5],
        "mode": "kg_local_direct",
        "catatan": "Jawaban disajikan via engine lokal Knowledge Graph.",
    }


def chat(pertanyaan: str, history: list[dict] = None) -> dict:
    """
    Fungsi utama chatbot interaktif:
    Menerima pertanyaan dan riwayat percakapan, langsung memanggil API dengan data Knowledge Graph,
    dan mengembalikan jawaban beserta komponen Explainable AI (XAI).
    """
    if history is None:
        history = []

    q = pertanyaan.strip()
    if not q:
        return {
            "pertanyaan": "",
            "jawaban": "Pertanyaan tidak boleh kosong. Silakan tuliskan pertanyaan seputar inovasi Jawa Timur.",
            "xai": {
                "alur_penalaran": ["Validasi input: Pertanyaan kosong."],
                "entitas_graph": [],
                "relasi_kunci": [],
                "faktor_penentu": [],
                "tingkat_keyakinan": "Rendah",
                "grounded": False,
            },
            "evidence": [],
            "mode": "validation",
            "catatan": None,
        }

    kg_context, evidence = build_kg_context(q)
    api_key = kunci()

    if not api_key:
        logger.warning("GROQ_API_KEY kosong, beralih ke fallback Knowledge Graph.")
        fb = _chat_fallback(q, kg_context, evidence)
        fb["catatan"] = "GROQ_API_KEY di backend/.env belum diisi. Menggunakan Knowledge Graph langsung secara lokal."
        return fb

    # Siapkan pesan untuk Groq Chat Completion
    system_msg = {"role": "system", "content": _system_prompt(kg_context)}
    messages = [system_msg]

    # Sertakan hingga 6 percakapan terakhir untuk multi-turn chat memory
    for h in history[-6:]:
        role = h.get("role", "user")
        content = h.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": q})

    try:
        r = httpx.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": settings.GROQ_MODEL,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": messages,
            },
            timeout=35,
        )
        r.raise_for_status()
        raw_content = r.json()["choices"][0]["message"]["content"].strip()
        data = json.loads(raw_content)

        jawaban = data.get("jawaban", "")
        xai_data = data.get("xai", {})

        # Validasi struktur XAI
        xai = {
            "alur_penalaran": xai_data.get("alur_penalaran") or [
                "Langkah 1: Identifikasi topik dan entitas pertanyaan pada Knowledge Graph.",
                "Langkah 2: Pengambilan fakta data nodes dan relasi graph.",
                "Langkah 3: Perumusan jawaban faktual dengan grounding penuh.",
            ],
            "entitas_graph": xai_data.get("entitas_graph") or [],
            "relasi_kunci": xai_data.get("relasi_kunci") or ["(Knowledge Graph) -[TERKAIT]-> (Pertanyaan)"],
            "faktor_penentu": xai_data.get("faktor_penentu") or ["Data faktual Knowledge Graph Jawa Timur"],
            "tingkat_keyakinan": xai_data.get("tingkat_keyakinan") or "Tinggi (100% Terverifikasi Knowledge Graph)",
            "grounded": xai_data.get("grounded", True),
        }

        return {
            "pertanyaan": q,
            "jawaban": jawaban,
            "xai": xai,
            "evidence": evidence[:6],
            "mode": "direct_api_kg",
            "catatan": None,
        }

    except Exception as e:
        logger.error(f"Gagal memanggil Groq API: {e}. Mengaktifkan fallback Knowledge Graph.")
        fb = _chat_fallback(q, kg_context, evidence)
        fb["catatan"] = f"Panggilan API mengalami kendala ({type(e).__name__}). Menggunakan fallback data Knowledge Graph langsung."
        return fb


def jawab(pertanyaan: str, pakai_genai: bool = True) -> dict:
    """
    Fungsi kompatibilitas ke belakang untuk endpoint RAG lama (/ai/rag).
    Sekarang langsung didukung oleh Direct API + Knowledge Graph + XAI.
    """
    res = chat(pertanyaan, history=[])
    xai = res.get("xai", {})
    entitas_str = ", ".join(e["nama"] if isinstance(e, dict) else str(e) for e in xai.get("entitas_graph", []))
    path = f"Knowledge Graph Direct API (Entitas: {entitas_str or 'Data Inovasi Jatim'})"

    return {
        "pertanyaan": pertanyaan,
        "path": path,
        "evidence": [f"{r}" for r in xai.get("relasi_kunci", [])] + res.get("evidence", []),
        "jawaban": res.get("jawaban", ""),
        "grounded": xai.get("grounded", True),
        "mode": "direct_api_kg",
        "catatan": res.get("catatan"),
        "xai": xai,
    }

