# 🎓 University Talent Hub (MVP)

Ekosistem talenta mahasiswa berbasis gamification — MVP untuk TOPRANK LOGIC AI DEVELOPMENT #3.

Stack: **Node.js + Express + SQLite (better-sqlite3)** + Frontend HTML/CSS/JS murni (tanpa build step) — sengaja dipilih supaya simpel untuk dicoba dan dinilai.

---

## 🚀 Cara Menjalankan (tanpa Docker)

```bash
# 1. Install dependencies
npm install

# 2. (opsional) copy env
cp .env.example .env

# 3. Jalankan
npm start
```

Buka browser: **http://localhost:4000**

Database SQLite otomatis dibuat di `data/talenthub.db` beserta akun demo saat pertama kali dijalankan.

### Akun Demo
| Role | Email | Password |
|---|---|---|
| Admin | admin@talenthub.id | admin123 |
| Mahasiswa | budi@student.id | mahasiswa123 |

Atau daftar akun mahasiswa baru sendiri lewat tab **"Daftar Mahasiswa"** di halaman login.

---

## 🐳 Cara Menjalankan dengan Docker

```bash
docker compose up --build
```

Buka browser: **http://localhost:4000**

Data (`data/`) dan file upload (`uploads/`) di-mount sebagai volume supaya tidak hilang saat container di-restart.

---

## 📁 Struktur Project (per file/fitur)

```
university-talent-hub/
├── src/
│   ├── server.js                 # entry point, menyatukan API + frontend
│   ├── db.js                     # schema database + seed data awal
│   ├── middleware/
│   │   ├── auth.js               # verifikasi JWT & role guard
│   │   └── upload.js             # upload file bukti (multer)
│   ├── routes/
│   │   ├── auth.routes.js        # FITUR: Login & Register
│   │   ├── mahasiswa.routes.js   # FITUR: semua fitur role mahasiswa
│   │   └── admin.routes.js       # FITUR: semua fitur role admin
│   └── utils/
│       └── recommend.js          # FITUR: AI Recommendation (rule-based matching)
├── public/
│   ├── index.html                # halaman Login & Register
│   ├── admin.html                # dashboard Admin (tab per fitur)
│   ├── mahasiswa.html            # dashboard Mahasiswa (tab per fitur)
│   ├── css/style.css
│   └── js/
│       ├── api.js                # helper fetch + session
│       ├── auth.js                # logic login/register
│       ├── admin.js               # logic dashboard admin
│       └── mahasiswa.js           # logic dashboard mahasiswa
├── Dockerfile
├── docker-compose.yml
└── data/ , uploads/               # dibuat otomatis saat runtime
```

## 🧪 Cara Cepat Mencoba Alur Bisnis Utama

1. Login sebagai **admin**, buka tab **Opportunity**, posting 1-2 opportunity dengan skill tags.
2. Logout, login/daftar sebagai **mahasiswa**.
3. Lengkapi profil di tab **Profil Saya**.
4. Ajukan skill/sertifikat/portofolio di tab masing-masing.
5. Login lagi sebagai **admin** → tab **Verifikasi** → approve pengajuan (isi poin jika perlu).
6. Login sebagai mahasiswa → cek **Leaderboard** (poin sudah bertambah) dan **Reward** (klaim jika poin cukup).
7. Cek tab **Rekomendasi AI** untuk lihat opportunity yang cocok dengan skill yang sudah approved.

Selamat mencoba! 🚀
