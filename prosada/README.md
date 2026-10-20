# PROSADA (JUSTINFO) — Web Application

Dashboard analitik inovasi daerah Jawa Timur berbasis **FastAPI (Backend)** dan **React + Vite + Tailwind CSS (Frontend)**.

```
prosada/
├── backend/            # FastAPI REST API
│   ├── core/           # Konfigurasi Pydantic & Middleware (CORS)
│   ├── routers/        # Endpoint data analitik & AI Chat/RAG
│   ├── schemas/        # Schema Pydantic request & response
│   ├── services/       # data_service (agregasi KG), ai_service (LLM + XAI), rag_service (Graph RAG)
│   ├── data/           # Dataset CSV Knowledge Graph (sinkron dari Prosada-Final)
│   ├── main.py         # Entrypoint aplikasi FastAPI
│   ├── Procfile        # Konfigurasi deployment Railway/Heroku
│   └── requirements.txt
└── frontend/           # React 19 + Vite SPA
    ├── src/
    │   ├── assets/     # Logo JUSTINFO, BRIDA Jatim, dan media
    │   ├── components/ # WilayahMap (Leaflet), BarList, GraphView, ChatbotWidget, StatCard, dll.
    │   ├── hooks/      # Custom React hooks (useFetch)
    │   ├── lib/        # Helper utilitas & format (fmt, TK_COLOR)
    │   ├── pages/      # LandingPage, HomePage, WilayahPage, ProfilPage, KnowledgeGraphPage, AiInsightPage
    │   ├── services/   # Client API (fetch wrapper data & AI)
    │   ├── App.jsx     # Routing & navigasi utama
    │   └── main.jsx    # Mount React DOM
    ├── index.html      # HTML root & metadata SEO
    ├── package.json
    ├── vercel.json     # Konfigurasi SPA rewrite Vercel
    └── vite.config.js
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Backend (FastAPI)

Buka terminal pertama di direktori `prosada/backend`:

```bash
cd prosada/backend

# Buat virtual environment (opsional tetapi disarankan)
python -m venv .venv
# Aktifkan virtual environment:
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate

# Install dependensi
pip install -r requirements.txt

# Siapkan environment variables
cp .env.example .env

# Jalankan server uvicorn
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Endpoint API Root: `http://localhost:8000`
- Dokumentasi Interaktif Swagger UI: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`

### 2. Frontend (React + Vite)

Buka terminal kedua di direktori `prosada/frontend`:

```bash
cd prosada/frontend

# Install dependensi npm
npm install

# Siapkan environment variables
cp .env.example .env

# Jalankan server pengembangan Vite
npm run dev
```

Buka browser di `http://localhost:5173`.

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/health` | Pemeriksaan kesehatan layanan backend (`{"status": "ok"}`) |
| `GET` | `/data/ringkasan` | Statistik utama inovasi Jatim, distribusi jenis, bentuk, tingkat wilayah, dan top wilayah |
| `GET` | `/data/wilayah` | Data sebaran inovasi dan rata-rata skor kematangan 38 kab/kota beserta koordinat geografis |
| `GET` | `/data/profil` | Profil ekosistem wilayah (3) dan karakteristik provinsi (3) beserta bobot relasi dominan |
| `GET` | `/data/kg` | Metadata Knowledge Graph (jumlah node, jumlah relasi, dan distribusi tipe) |
| `GET` | `/ai/status` | Status ketersediaan integrasi Groq LLM dan ringkasan graf |
| `POST` | `/ai/chat` | Chatbot multi-turn dengan Explainable AI (XAI) transparan: `{ "pertanyaan": "...", "history": [...] }` |
| `POST` | `/ai/rag` | Graph RAG terarah: `{ "pertanyaan": "...", "pakai_genai": true }` |

---

## ⚙️ Environment Variables

### Backend (`prosada/backend/.env`)

| Variabel | Bawaan | Keterangan |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:5173` | Domain frontend yang diizinkan CORS (bisa dipisah koma untuk multiple origin) |
| `GROQ_API_KEY` | `""` | Kunci API Groq Cloud (opsional, jika kosong sistem menggunakan fallback KG) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Model LLM yang digunakan di Groq (mis. `llama-3.3-70b-versatile`) |
| `DATA_DIR` | `""` | Path custom direktori dataset CSV (kosong = bawaan `backend/data/`) |

### Frontend (`prosada/frontend/.env`)

| Variabel | Bawaan | Keterangan |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | URL publik backend FastAPI (saat deploy, arahkan ke URL Railway/Render) |

---

## 🌐 Panduan Deployment

### Deployment Backend (Railway / Render)
1. Buat service baru di Railway / Render dengan repository ini.
2. Atur **Root Directory** ke `prosada/backend`.
3. Perintah build: `pip install -r requirements.txt`.
4. Perintah start: `uvicorn main:app --host 0.0.0.0 --port $PORT` (otomatis terdeteksi lewat `Procfile`).
5. Tambahkan environment variables:
   - `FRONTEND_URL`: URL domain production frontend Vercel (misal: `https://prosada.vercel.app`).
   - `GROQ_API_KEY`: Kunci API Groq Anda.

### Deployment Frontend (Vercel)
1. Import repository ke Vercel.
2. Atur **Root Directory** ke `prosada/frontend`.
3. Framework Preset: **Vite**.
4. Tambahkan Environment Variable:
   - `VITE_API_URL`: URL backend Railway production (misal: `https://prosada-backend.up.railway.app`).
5. File `vercel.json` sudah disediakan untuk memastikan routing SPA React bekerja mulus pada semua subpath.
