// src/routes/auth.routes.js
// Fitur: Authentication (Login & Register) - dipakai oleh Admin & Mahasiswa.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Registrasi akun mahasiswa (akun admin dibuat lewat seed, lihat src/db.js)
router.post('/register', (req, res) => {
  const { email, password, name, nim, prodi, angkatan } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, dan nama wajib diisi.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email sudah terdaftar.' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (role,email,password,name,nim,prodi,angkatan) VALUES ('mahasiswa',?,?,?,?,?,?)`
    )
    .run(email, hash, name, nim || null, prodi || null, angkatan || null);

  res.json({ message: 'Registrasi berhasil, silakan login.', id: info.lastInsertRowid });
});

// Login untuk admin maupun mahasiswa
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'ganti_dengan_secret_yang_kuat',
    { expiresIn: '2d' }
  );

  const { password: _pw, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

module.exports = router;
