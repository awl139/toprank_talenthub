// src/routes/mahasiswa.routes.js
// Semua fitur Role Mahasiswa: profil, skill, sertifikat, portofolio,
// leaderboard, reward catalog, dan rekomendasi AI.
const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getRecommendations } = require('../utils/recommend');

const router = express.Router();
router.use(verifyToken, requireRole('mahasiswa'));

// --- Talent Profile ---
router.get('/profile', (req, res) => {
  const user = db
    .prepare('SELECT id,role,email,name,nim,prodi,angkatan,bio,photo_url,point FROM users WHERE id=?')
    .get(req.user.id);
  res.json(user);
});

router.put('/profile', (req, res) => {
  const { name, nim, prodi, angkatan, bio } = req.body;
  db.prepare('UPDATE users SET name=?,nim=?,prodi=?,angkatan=?,bio=? WHERE id=?').run(
    name, nim, prodi, angkatan, bio, req.user.id
  );
  res.json({ message: 'Profil berhasil diperbarui.' });
});

// --- Skill Management ---
router.post('/skills', upload.single('proof'), (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama skill wajib diisi.' });
  const proof_url = req.file ? `/uploads/${req.file.filename}` : null;
  const info = db
    .prepare('INSERT INTO skills (user_id,name,category,proof_url) VALUES (?,?,?,?)')
    .run(req.user.id, name, category || null, proof_url);
  res.json({ message: 'Skill diajukan, menunggu verifikasi admin.', id: info.lastInsertRowid });
});

router.get('/skills', (req, res) => {
  res.json(db.prepare('SELECT * FROM skills WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});

// --- Portfolio Management (sertifikat) ---
router.post('/certificates', upload.single('file'), (req, res) => {
  const { title, level } = req.body;
  if (!title || !level) return res.status(400).json({ error: 'Judul dan tingkat sertifikat wajib diisi.' });
  const file_url = req.file ? `/uploads/${req.file.filename}` : null;
  const info = db
    .prepare('INSERT INTO certificates (user_id,title,level,file_url) VALUES (?,?,?,?)')
    .run(req.user.id, title, level, file_url);
  res.json({ message: 'Sertifikat diajukan, menunggu verifikasi admin.', id: info.lastInsertRowid });
});

router.get('/certificates', (req, res) => {
  res.json(db.prepare('SELECT * FROM certificates WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});

// --- Portfolio Management (portofolio) ---
router.post('/portfolios', upload.single('file'), (req, res) => {
  const { title, type, description } = req.body;
  if (!title || !type) return res.status(400).json({ error: 'Judul dan tipe portofolio wajib diisi.' });
  const file_url = req.file ? `/uploads/${req.file.filename}` : null;
  const info = db
    .prepare('INSERT INTO portfolios (user_id,title,type,description,file_url) VALUES (?,?,?,?,?)')
    .run(req.user.id, title, type, description || null, file_url);
  res.json({ message: 'Portofolio diajukan, menunggu verifikasi admin.', id: info.lastInsertRowid });
});

router.get('/portfolios', (req, res) => {
  res.json(db.prepare('SELECT * FROM portfolios WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});

// --- Status pengajuan gabungan (skill + sertifikat + portofolio) ---
router.get('/submissions', (req, res) => {
  const skills = db.prepare("SELECT id,'skill' as type,name as title,status,point,note,created_at FROM skills WHERE user_id=?").all(req.user.id);
  const certs = db.prepare("SELECT id,'certificate' as type,title,status,point,note,created_at FROM certificates WHERE user_id=?").all(req.user.id);
  const ports = db.prepare("SELECT id,'portfolio' as type,title,status,point,note,created_at FROM portfolios WHERE user_id=?").all(req.user.id);
  const all = [...skills, ...certs, ...ports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(all);
});

// --- Reward Catalog ---
router.get('/rewards', (req, res) => {
  res.json(db.prepare('SELECT * FROM rewards ORDER BY point_required ASC').all());
});

router.post('/rewards/:id/claim', (req, res) => {
  const reward = db.prepare('SELECT * FROM rewards WHERE id=?').get(req.params.id);
  if (!reward) return res.status(404).json({ error: 'Reward tidak ditemukan.' });
  if (reward.stock <= 0) return res.status(400).json({ error: 'Stok reward habis.' });

  const user = db.prepare('SELECT point FROM users WHERE id=?').get(req.user.id);
  if (user.point < reward.point_required) {
    return res.status(400).json({ error: 'Poin Anda tidak cukup untuk klaim reward ini.' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET point = point - ? WHERE id=?').run(reward.point_required, req.user.id);
    db.prepare('UPDATE rewards SET stock = stock - 1 WHERE id=?').run(reward.id);
    db.prepare("INSERT INTO reward_claims (user_id,reward_id,status) VALUES (?,?,'claimed')").run(req.user.id, reward.id);
  });
  tx();

  res.json({ message: 'Reward berhasil diklaim!' });
});

router.get('/my-claims', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT rc.*, r.title, r.point_required FROM reward_claims rc
         JOIN rewards r ON r.id = rc.reward_id
         WHERE rc.user_id=? ORDER BY rc.created_at DESC`
      )
      .all(req.user.id)
  );
});

// --- Leaderboard ---
router.get('/leaderboard', (req, res) => {
  res.json(
    db.prepare("SELECT id,name,prodi,point FROM users WHERE role='mahasiswa' ORDER BY point DESC LIMIT 50").all()
  );
});

// --- Opportunity list (untuk dilihat mahasiswa) ---
router.get('/opportunities', (req, res) => {
  res.json(db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all());
});

// --- AI Recommendation ---
router.get('/recommendations', (req, res) => {
  res.json(getRecommendations(req.user.id));
});

module.exports = router;
