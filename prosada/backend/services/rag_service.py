"""
Graph RAG: pertanyaan -> rencana -> graph retrieval -> evidence -> jawaban.

- Rencana (intent + entitas) dibuat oleh aturan sederhana. Jika GROQ_API_KEY terisi dan GenAI dipakai,
  LLM yang memahami pertanyaan bebas, lalu hasilnya divalidasi terhadap isi graph.
- Fakta selalu diambil dari graph. LLM hanya memahami pertanyaan dan merangkai kalimat dari evidence.
"""
import json
import re

import httpx

from core.config import settings
from services import data_service as ds

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
TIDAK_DIDUKUNG = re.compile(r"\b(anggaran|biaya|dana|apbd|apbn|gaji|penduduk|pdrb)\b", re.I)
RANKING = re.compile(r"terbanyak|paling banyak|teratas|tertinggi|terendah|paling sedikit|tersedikit")
PESAN_TIDAK_DIKENALI = (
    "Evidence tidak cukup. Coba tanyakan karakteristik sebuah profil (mis. 'Profil Ekosistem Wilayah 2'), "
    "data sebuah daerah (mis. 'Kabupaten Madiun'), ringkasan inovasi Jawa Timur, wilayah dengan inovasi "
    "terbanyak, atau wilayah tingkat Tinggi."
)


# ------------------------------------------------------------------ rencana (aturan)
def cari_profil(q: str):
    m = re.search(r"ekosistem\D{0,30}?(\d)", q)
    if m:
        pid = f"PROFILE_EKO_0{m.group(1)}"
    else:
        m = re.search(r"provinsi\D{0,10}?(\d)", q)
        pid = f"PROFILE_PROV_0{m.group(1)}" if m else None
    return pid if pid in ds.profil_by_id() else None


def cari_daerah(q: str):
    for nama in sorted(ds.daerah_id_map(), key=len, reverse=True):
        if nama.lower() in q or ds.daerah_pendek(nama).lower() in q:
            return nama
    return None


def rencana_rule(q: str) -> dict:
    if TIDAK_DIDUKUNG.search(q):
        return {"intent": "tidak_didukung"}
    pid = cari_profil(q)
    if pid:
        return {"intent": "profil", "profil_id": pid, "multi_hop": "daerah" in q}
    nama = cari_daerah(q)
    if nama:
        return {"intent": "daerah", "daerah": nama}
    if RANKING.search(q):
        asc = bool(re.search(r"terendah|paling sedikit|tersedikit", q))
        return {"intent": "ranking", "urut": "kematangan" if "kematangan" in q else "n",
                "arah": "asc" if asc else "desc"}
    m = re.search(r"\b(tinggi|sedang|rendah)\b", q)
    if m and re.search(r"tingkat|cluster|kematangan", q):
        return {"intent": "tingkat", "tingkat": m.group(1).capitalize()}
    if re.search(r"jawa timur|jatim|seluruh|keseluruhan|total|jumlah inovasi|berapa (banyak )?inovasi", q):
        return {"intent": "ringkasan"}
    return {"intent": "tidak_dikenali"}


# ------------------------------------------------------------------ retrieval
def evidence_profil(pid: str) -> list[str]:
    p = ds.profil_by_id()[pid]
    ev = []
    for k in ("jenis", "bentuk", "urusan", "tahapan"):
        for x in p.get(k, []):
            ev.append(f"{pid} —DOMINAN_{k.upper()}→ {x['nama']} ({ds.idn(x['pct'])}%)")
    return ev


def deskripsi_profil(pid: str) -> str:
    p = ds.profil_by_id()[pid]

    def atas(k):
        x = p[k][0]
        return f"{x['nama'] if k == 'jenis' else x['nama'].lower()} ({ds.idn(x['pct'])}%)"

    return (f"{p['nama']} (tingkat {p['tingkat']}) mencakup {p['ringkas'].split('· ')[-1]}. "
            f"Jenis dominan {atas('jenis')}, bentuk dominan {atas('bentuk')}, "
            f"urusan dominan {atas('urusan')}, dan tahapan terbanyak {atas('tahapan')}.")


def rag_profil(pid: str, multi_hop: bool):
    p = ds.profil_by_id()[pid]
    if pid.startswith("PROFILE_EKO") and multi_hop:
        id_daerah = {v: k for k, v in ds.daerah_id_map().items()}
        ids = ds.edges_of("TERMASUK_PROFIL_EKOSISTEM").query("target_id == @pid").source_id.tolist()
        nama = [ds.daerah_pendek(id_daerah[i]) for i in ids if i in id_daerah]
        ev = [f"{i} —TERMASUK_PROFIL_EKOSISTEM→ {pid} ({ds.daerah_pendek(id_daerah[i])})"
              for i in ids if i in id_daerah]
        ev += [e for e in evidence_profil(pid) if "URUSAN" in e]
        urusan = ", ".join(f"{x['nama'].lower()} ({ds.idn(x['pct'])}%)" for x in p["urusan"])
        jawab = (f"{p['nama']} memuat {len(nama)} daerah: {', '.join(nama)}, dengan total "
                 f"{p['n_inovasi']} inovasi. Urusan dominannya {urusan}.")
        return "Profil → Daerah → Inovasi → Urusan", ev, jawab
    return "Profil → weighted DOMINAN_*", evidence_profil(pid), deskripsi_profil(pid)


def rag_daerah(nama: str):
    inv = ds.load_inovasi()
    did = ds.daerah_id_map()[nama]
    ids = ds.edges_of("BERADA_DI").query("target_id == @did").source_id
    d = inv[inv.node_id.isin(ids)]
    ev = [f"{did} ({nama}) ←BERADA_DI— {len(d)} inovasi",
          f"Rata-rata kematangan {ds.idn(d.kematangan.mean())}"]
    for r in d.sort_values("kematangan", ascending=False).head(3).itertuples():
        ev.append(f"{r.node_id}: {r.judul_inovasi} (kematangan {ds.idn(r.kematangan, 0)})")
    jawab = f"{nama} memiliki {len(d)} inovasi dengan rata-rata kematangan {ds.idn(d.kematangan.mean())}."
    pid = ds.edges_of("TERMASUK_PROFIL_EKOSISTEM").query("source_id == @did").target_id.tolist()
    if pid:
        p = ds.profil_by_id()[pid[0]]
        ev.append(f"{did} —TERMASUK_PROFIL_EKOSISTEM→ {pid[0]}")
        jawab += f" Daerah ini masuk {p['nama']} (tingkat {p['tingkat']})."
    return "Daerah ← Inovasi (+ Profil)", ev, jawab


def rag_ringkasan():
    r = ds.get_ringkasan()
    total, kab = r["inovasi"], r["pemda"] - 1
    ev = [f"Node Inovasi: {total}",
          f"Node Daerah: {r['pemda']} ({kab} kab/kota + provinsi)",
          f"Node AdminOPD: {r['opd']}"]
    ev += [f"Jenis {x['nama']}: {x['n']} ({ds.idn(x['n'] / total * 100)}%)" for x in r["jenis"]]
    ev += [f"Tahap penerapan: {ds.idn(r['penerapan_pct'])}%",
           f"Rata-rata kematangan: {ds.idn(r['avg_kematangan'])}"]
    j = r["jenis"][0]
    jawab = (f"Knowledge Graph mencatat {total} inovasi dari {r['pemda']} pemerintah daerah Jawa Timur "
             f"({kab} kab/kota dan provinsi), dikelola {r['opd']} Admin OPD. Jenis terbanyak {j['nama']} "
             f"({j['n']} inovasi), {ds.idn(r['penerapan_pct'])}% sudah tahap penerapan, dan rata-rata "
             f"kematangan {ds.idn(r['avg_kematangan'])}.")
    return "Agregasi seluruh node Inovasi", ev, jawab


def rag_ranking(urut: str, arah: str):
    key = "m" if urut == "kematangan" else "n"
    w = sorted(ds.get_wilayah(), key=lambda x: (x[key], x["n"]), reverse=(arah != "asc"))[:5]
    ev = [f"{x['nama']} — {x['n']} inovasi, rata-rata kematangan {ds.idn(x['m'])}, tingkat {x['tk']}" for x in w]
    label = "rata-rata kematangan" if key == "m" else "jumlah inovasi"
    sisi = "terendah" if arah == "asc" else "tertinggi"
    isi = "; ".join(f"{x['nama']} ({ds.idn(x['m']) if key == 'm' else x['n']})" for x in w)
    jawab = f"Lima wilayah dengan {label} {sisi}: {isi}."
    if key == "m":
        jawab += " Wilayah dengan 1–3 inovasi skornya mudah bergeser."
    return "Daerah → agregasi inovasi (peringkat)", ev, jawab


def rag_tingkat(tk: str):
    w = [x for x in ds.get_wilayah() if x["tk"] == tk]
    if not w:
        return None
    ev = [f"{x['nama']} — {x['n']} inovasi (tingkat {tk})" for x in w]
    isi = ", ".join(f"{x['nama']} ({x['n']})" for x in w[:10])
    sisa = len(w) - 10
    jawab = (f"Ada {len(w)} wilayah dengan tingkat kematangan {tk}: {isi}"
             + (f", dan {sisa} wilayah lainnya." if sisa > 0 else "."))
    return "Daerah → tingkat kematangan hasil clustering", ev, jawab


def eksekusi(plan: dict):
    intent = plan.get("intent")
    if intent == "profil":
        return rag_profil(plan["profil_id"], bool(plan.get("multi_hop")))
    if intent == "daerah":
        return rag_daerah(plan["daerah"])
    if intent == "ringkasan":
        return rag_ringkasan()
    if intent == "ranking":
        return rag_ranking(plan.get("urut") or "n", plan.get("arah") or "desc")
    if intent == "tingkat":
        return rag_tingkat(plan["tingkat"])
    return None


# ------------------------------------------------------------------ LLM (Groq)
class GroqError(Exception):
    """Kegagalan memanggil Groq, dengan pesan yang bisa langsung ditampilkan ke pengguna."""


HINT_HTTP = {
    400: "permintaan ditolak, cek nama model di GROQ_MODEL",
    401: "API key tidak valid, cek GROQ_API_KEY di backend/.env",
    403: "akses ditolak, cek key dan izin akunnya",
    404: "model tidak ditemukan, cek GROQ_MODEL",
    429: "kuota atau rate limit Groq habis, coba lagi sebentar",
}


def kunci() -> str:
    """GROQ_API_KEY tanpa spasi dan tanda kutip yang sering ikut tersalin ke .env."""
    return settings.GROQ_API_KEY.strip().strip("\"'").strip()


def _pesan_http(resp: httpx.Response) -> str:
    try:
        detail = resp.json()["error"]["message"]
    except Exception:
        detail = resp.text[:150]
    hint = HINT_HTTP.get(resp.status_code)
    return f"Groq menolak permintaan (HTTP {resp.status_code}{': ' + hint if hint else ''}). Detail: {detail}"


def _alasan(e: Exception) -> str:
    return str(e) if isinstance(e, GroqError) else f"{type(e).__name__}"


def _chat(messages: list[dict], temperature: float) -> str:
    try:
        r = httpx.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {kunci()}"},
            json={"model": settings.GROQ_MODEL, "temperature": temperature, "messages": messages},
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        raise GroqError(_pesan_http(e.response)) from e
    except httpx.HTTPError as e:
        raise GroqError(f"Tidak bisa terhubung ke Groq ({type(e).__name__}). Cek koneksi internet.") from e


def _validasi(plan: dict):
    """Rencana dari LLM hanya diterima jika entitasnya benar-benar ada di graph."""
    intent = plan.get("intent")
    if intent in ("tidak_didukung", "tidak_dikenali"):
        return {"intent": intent}
    if intent == "profil" and plan.get("profil_id") in ds.profil_by_id():
        return {"intent": "profil", "profil_id": plan["profil_id"], "multi_hop": bool(plan.get("multi_hop"))}
    if intent == "daerah" and plan.get("daerah") in ds.daerah_id_map():
        return {"intent": "daerah", "daerah": plan["daerah"]}
    if intent == "ringkasan":
        return {"intent": "ringkasan"}
    if intent == "ranking":
        return {"intent": "ranking", "urut": "kematangan" if plan.get("urut") == "kematangan" else "n",
                "arah": "asc" if plan.get("arah") == "asc" else "desc"}
    if intent == "tingkat" and plan.get("tingkat") in ("Tinggi", "Sedang", "Rendah"):
        return {"intent": "tingkat", "tingkat": plan["tingkat"]}
    return None


def rencana_llm(pertanyaan: str):
    """LLM memahami pertanyaan bebas menjadi rencana terstruktur. Mengembalikan (rencana, catatan, api_gagal)."""
    profil = "; ".join(f"{p['id']} = {p['nama']}" for p in ds.get_profil())
    daerah = "; ".join(ds.daerah_id_map())
    sistem = (
        "Kamu perencana query untuk Knowledge Graph inovasi daerah Jawa Timur. Ubah pertanyaan pengguna menjadi "
        "satu objek JSON, tanpa teks lain.\n"
        'Skema: {"intent": "profil|daerah|ringkasan|ranking|tingkat|tidak_didukung|tidak_dikenali", '
        '"profil_id": string|null, "daerah": string|null, "tingkat": "Tinggi|Sedang|Rendah"|null, '
        '"urut": "n|kematangan"|null, "arah": "desc|asc"|null, "multi_hop": boolean}\n'
        "- profil: karakteristik sebuah profil. multi_hop=true jika pengguna juga menanyakan daerah anggotanya.\n"
        "- daerah: data satu pemda. Pakai nama persis dari daftar daerah.\n"
        "- ringkasan: angka keseluruhan Jawa Timur (total inovasi, jumlah pemda, jenis, tahapan).\n"
        "- ranking: peringkat wilayah menurut jumlah inovasi (urut=n) atau rata-rata kematangan (urut=kematangan).\n"
        "- tingkat: daftar wilayah pada tingkat kematangan tertentu hasil clustering.\n"
        "- tidak_didukung: data yang tidak ada di graph, misalnya anggaran, biaya, penduduk, PDRB.\n"
        "- tidak_dikenali: di luar topik inovasi daerah.\n"
        f"Daftar profil: {profil}\nDaftar daerah: {daerah}"
    )
    try:
        teks = _chat([{"role": "system", "content": sistem}, {"role": "user", "content": pertanyaan}], 0)
        plan = _validasi(json.loads(re.search(r"\{.*\}", teks, re.S).group(0)))
    except GroqError as e:
        return None, f"{str(e).rstrip('.')}. Dipakai pembacaan aturan dan jawaban template.", True
    except Exception as e:
        return None, f"LLM tidak mengembalikan rencana yang bisa dibaca ({_alasan(e)}), dipakai pembacaan aturan.", False
    if plan is None:
        return None, "Rencana dari LLM tidak cocok dengan isi graph, dipakai pembacaan aturan.", False
    return plan, None, False


def tulis_jawaban(pertanyaan: str, evidence: list[str]):
    """LLM merangkai jawaban hanya dari evidence. Mengembalikan (teks, catatan)."""
    bukti = "\n".join(f"[{i + 1}] {e}" for i, e in enumerate(evidence))
    try:
        teks = _chat(
            [
                {"role": "system",
                 "content": "Kamu asisten analitik inovasi daerah Jawa Timur. Jawab dalam bahasa Indonesia "
                            "hanya berdasarkan evidence yang diberikan. Jangan menambah fakta atau angka. "
                            "Jika evidence tidak cukup, katakan evidence tidak cukup."},
                {"role": "user", "content": f"EVIDENCE:\n{bukti}\n\nPERTANYAAN: {pertanyaan}"},
            ],
            0.2,
        )
        return (teks, None) if teks else (None, "Groq mengembalikan jawaban kosong, dipakai jawaban template.")
    except Exception as e:
        return None, f"{_alasan(e).rstrip('.')}. Dipakai jawaban template."


# ------------------------------------------------------------------ entry point
def jawab(pertanyaan: str, pakai_genai: bool = False) -> dict:
    q = pertanyaan.strip().lower()
    out = {"pertanyaan": pertanyaan, "path": "-", "evidence": [], "jawaban": "",
           "grounded": False, "mode": "template", "catatan": None}
    if not q:
        out["jawaban"] = "Pertanyaan kosong."
        return out

    aktif = bool(kunci())
    pakai = pakai_genai and aktif
    if pakai_genai and not aktif:
        out["catatan"] = "GenAI tidak aktif: GROQ_API_KEY di backend/.env masih kosong, jadi dipakai jawaban template."

    plan = None
    if pakai:
        plan, catatan, api_gagal = rencana_llm(pertanyaan)
        if plan is None:
            out["catatan"] = catatan
        if api_gagal:  # Groq menolak: jangan panggil lagi untuk merangkai jawaban
            pakai = False
    dari_llm = plan is not None
    if plan is None:
        plan = rencana_rule(q)

    intent = plan["intent"]
    if intent == "tidak_didukung":
        out["path"] = "Atribut yang ditanyakan tidak ada pada skema graph"
        out["jawaban"] = ("Evidence tidak cukup. Atribut tersebut tidak tersedia di Knowledge Graph, "
                          "jadi sistem tidak menebak jawabannya dan tidak mengirimnya ke GenAI.")
        return out

    hasil = eksekusi(plan)
    if hasil is None:
        out["path"] = "Entitas tidak dikenali"
        out["jawaban"] = PESAN_TIDAK_DIKENALI
        return out

    path, ev, jawaban = hasil
    if dari_llm:
        path = f"Dipahami LLM ({intent}) → {path}"
    out.update(path=path, evidence=ev, jawaban=jawaban, grounded=True)

    if pakai:
        teks, catatan = tulis_jawaban(pertanyaan, ev)
        if teks:
            out.update(jawaban=teks, mode="genai")
        else:
            out["catatan"] = catatan
    return out
