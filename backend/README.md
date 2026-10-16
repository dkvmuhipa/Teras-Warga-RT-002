# Backend Python (FastAPI) - Teras Warga RT 02

Backend modern berbasis **FastAPI** untuk aplikasi Teras Warga RT 02 Huntap Tondo.

## ✨ Fitur Backend

- **FastAPI + Uvicorn:** RESTful API asynchronous berkinerja tinggi dengan validasi schema Pydantic.
- **Swagger UI Otomatis:** Akses dokumentasi interaktif di `http://127.0.0.1:8000/docs`.
- **Socket.IO Real-time:** Sinyal darurat warga (`emergency:triggered` -> `emergency:alert`) dengan broadcast instan.
- **Google GenAI Python SDK:** Layanan chatbot AI "Ask-RIT", generator broadcast WhatsApp terpersonalisasi, analisis laporan, dan draft pengumuman dengan sistem cadangan (resilient fallback).
- **BMKG & USGS Proxy:** Peringatan gempa bumi dengan in-memory cache 2 menit.
- **Open-Meteo Proxy:** Prakiraan cuaca dan indeks kualitas udara (AQI).
- **Cloudinary Integration:** Upload berkas dan direct signed upload.
- **Firebase Admin SDK:** Pengiriman notifikasi push (FCM) dan pembersihan token usang.
- **WhatsApp Gateway:** Pengiriman pesan via Sidobe gateway.

---

## 🚀 Cara Menjalankan

### 1. Masuk ke direktori backend
```bash
cd backend
```

### 2. Mengaktifkan Virtual Environment
```bash
# Windows Command Prompt
.venv\Scripts\activate.bat

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

### 3. Menjalankan Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Atau cukup klik dua kali file `run.bat`.

---

## 🔌 Daftar Endpoint Utama

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/health` | Pemeriksaan status server |
| `GET` | `/api/weather` | Data cuaca Open-Meteo |
| `GET` | `/api/aqi` | Kualitas udara Open-Meteo |
| `GET` | `/api/earthquakes` | Gempa BMKG / USGS |
| `POST`| `/api/upload` | Upload media ke Cloudinary |
| `GET` | `/api/sign-upload` | Ambil tanda tangan Cloudinary |
| `POST`| `/api/whatsapp/send` | Kirim pesan WhatsApp |
| `GET` | `/api/whatsapp/groups` | Daftar grup WhatsApp |
| `POST`| `/api/push/send` | Notifikasi FCM Firebase |
| `POST`| `/api/gemini/announcement-draft` | Draf pengumuman warga |
| `POST`| `/api/gemini/analyze-reports` | Analisis keluhan warga |
| `POST`| `/api/gemini/dashboard-summary` | Ringkasan dashboard eksekutif |
| `POST`| `/api/gemini/ask-rit` | Chatbot virtual assistant warga |
| `POST`| `/api/gemini/generate-broadcast` | Draf siaran WhatsApp |
