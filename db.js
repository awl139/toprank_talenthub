// src/db.js
// Inisialisasi database SQLite, membuat schema jika belum ada, dan seed data awal.
// Menggunakan node:sqlite (modul bawaan Node.js sejak v22.5) - TIDAK perlu install
// package eksternal / compile native module, jadi bebas masalah node-gyp/Visual Studio.
require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/talenthub.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('admin','mahasiswa')),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  nim TEXT,
  prodi TEXT,
  angkatan TEXT,
  bio TEXT,
  photo_url TEXT,
  point INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  point INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('lokal','regional','nasional','internasional')),
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  point INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('personal','freelance','industri')),
  description TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  point INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  point_required INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  status TEXT DEFAULT 'claimed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  skill_tags TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// --- Seed default admin ---
const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (role,email,password,name) VALUES ('admin',?,?,?)`)
    .run('admin@talenthub.id', hash, 'Administrator');
  console.log('[seed] Default admin dibuat -> admin@talenthub.id / admin123');
}

// --- Seed contoh mahasiswa (biar leaderboard tidak kosong saat pertama kali coba) ---
const mhsExists = db.prepare("SELECT id FROM users WHERE role='mahasiswa'").get();
if (!mhsExists) {
  const hash = bcrypt.hashSync('mahasiswa123', 10);
  db.prepare(`INSERT INTO users (role,email,password,name,nim,prodi,angkatan,point) VALUES ('mahasiswa',?,?,?,?,?,?,?)`)
    .run('budi@student.id', hash, 'Budi Santoso', '2210511001', 'Teknik Informatika', '2022', 0);
  console.log('[seed] Contoh mahasiswa dibuat -> budi@student.id / mahasiswa123');
}

// --- Seed contoh reward ---
const rewardCount = db.prepare('SELECT COUNT(*) c FROM rewards').get().c;
if (rewardCount === 0) {
  const insertReward = db.prepare('INSERT INTO rewards (title, description, point_required, stock) VALUES (?,?,?,?)');
  insertReward.run('Voucher Kantin Rp10.000', 'Voucher belanja di kantin kampus', 10, 50);
  insertReward.run('Voucher Kantin Rp25.000', 'Voucher belanja di kantin kampus', 25, 30);
  insertReward.run('Merchandise Kampus (Totebag)', 'Totebag eksklusif kampus', 40, 20);
  insertReward.run('Sertifikat Mahasiswa Berprestasi', 'Sertifikat penghargaan resmi dari kampus', 60, 10);
  console.log('[seed] 4 contoh reward dibuat');
}

// --- Seed contoh opportunity (untuk uji fitur AI recommendation) ---
const oppCount = db.prepare('SELECT COUNT(*) c FROM opportunities').get().c;
if (oppCount === 0) {
  const admin = db.prepare("SELECT id FROM users WHERE role='admin'").get();
  const insertOpp = db.prepare('INSERT INTO opportunities (title, description, skill_tags, created_by) VALUES (?,?,?,?)');
  insertOpp.run('Dibutuhkan UI/UX Designer untuk Proyek Kampus', 'Membantu mendesain ulang website portal akademik.', 'ui/ux,figma,design', admin.id);
  insertOpp.run('Programmer Web untuk Startup Mahasiswa', 'Membangun aplikasi web menggunakan React & Node.js.', 'programmer,web,react,javascript', admin.id);
  insertOpp.run('Videografer untuk Dokumentasi Wisuda', 'Mendokumentasikan acara wisuda kampus.', 'videografer,editing,videography', admin.id);
  console.log('[seed] 3 contoh opportunity dibuat');
}

module.exports = db;
