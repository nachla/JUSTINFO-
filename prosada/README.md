# PROSADA

Dashboard analitik inovasi daerah Jawa Timur. Struktur mengikuti JATIVA: backend FastAPI, frontend React + Vite.

```
prosada/
├── backend/            # FastAPI
│   ├── core/           # config, middleware (CORS)
│   ├── routers/        # data, ai
│   ├── schemas/        # model pydantic
│   ├── services/       # data_service (agregasi KG), rag_service (Graph RAG)
│   ├── data/           # CSV Knowledge Graph hasil Prosada-Final
│   ├── main.py
│   └── requirements.txt
└── frontend/           # React + Vite + Tailwind
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        └── services/
```

## Jalankan

Backend (terminal 1):

    cd backend
    pip install -r requirements.txt
    cp .env.example .env        # opsional: isi GROQ_API_KEY untuk mode GenAI
    uvicorn main:app --reload

Dokumentasi API: http://localhost:8000/docs

Frontend (terminal 2):

    cd frontend
    npm install
    cp .env.example .env        # VITE_API_URL=http://localhost:8000
    npm run dev

Buka http://localhost:5173

## Endpoint

| Method | Path | Isi |
|---|---|---|
| GET | /data/ringkasan | statistik utama, jenis, bentuk, tingkat wilayah, top wilayah |
| GET | /data/wilayah | inovasi dan kematangan per kab/kota |
| GET | /data/profil | profil ekosistem (3) dan profil provinsi (3) beserta karakteristik dominan |
| GET | /data/kg | jumlah node dan relasi Knowledge Graph |
| POST | /ai/rag | Graph RAG: `{ "pertanyaan": "...", "pakai_genai": false }` |

## Environment variable

| Di mana | Nama | Isi |
|---|---|---|
| backend/.env | `FRONTEND_URL` | URL frontend (untuk CORS). Lokal `http://localhost:5173`, saat deploy URL Vercel |
| backend/.env | `GROQ_API_KEY` | Opsional. Kosong = Graph RAG memakai jawaban template dari graph |
| backend/.env | `GROQ_MODEL` | Opsional, bawaan `llama-3.3-70b-versatile` |
| frontend/.env | `VITE_API_URL` | URL backend. Lokal `http://localhost:8000`, saat deploy URL backend |

Semua variabel punya nilai bawaan, jadi aplikasi tetap jalan lokal tanpa file `.env`. File `.env` tidak boleh di-commit.

## Deploy

1. Backend (Railway): root directory `backend`, start command dari `Procfile`. Isi variabel `FRONTEND_URL` dan (opsional) `GROQ_API_KEY`. Folder `backend/data/` ikut ter-push karena CSV dibaca dari disk.
2. Frontend (Vercel): root directory `frontend`, framework Vite. Isi `VITE_API_URL` dengan URL backend dari Railway.
3. Setelah URL Vercel jadi, kembali ke Railway dan isi `FRONTEND_URL` dengan URL itu, lalu redeploy backend.
