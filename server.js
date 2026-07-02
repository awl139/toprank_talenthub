// src/server.js
// Entry point aplikasi. Menyatukan backend (API) dan frontend (static file)
// dalam satu server Express agar mudah dijalankan & di-deploy.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // pastikan DB & seed berjalan saat server start

const authRoutes = require('./routes/auth.routes');
const mahasiswaRoutes = require('./routes/mahasiswa.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(express.json());

// File upload (bukti skill/sertifikat/portofolio) bisa diakses langsung
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Frontend (halaman login, dashboard admin, dashboard mahasiswa)
app.use(express.static(path.join(__dirname, '../public')));

// API routes per fitur
app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/admin', adminRoutes);

// Health check (berguna untuk Docker/monitoring)
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Error handler umum (termasuk error dari multer)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Terjadi kesalahan pada server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`University Talent Hub berjalan di http://localhost:${PORT}`);
});
