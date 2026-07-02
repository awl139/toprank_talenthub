// src/routes/admin.routes.js
// Semua fitur Role Administrator: dashboard statistik, data mahasiswa,
// verifikasi skill/sertifikat/portofolio, reward management, leaderboard, opportunity.
const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

// --- Dashboard Statistik ---
router.get('/dashboard/stats', (req, res) => {
  const totalMahasiswa = db.prepare("SELECT COUNT(*) c FROM users WHERE role='mahasiswa'").get().c;
  const totalSkill = db.prepare("SELECT COUNT(*) c FROM skills WHERE status='approved'").get().c;
  const totalCertificate = db.prepare("SELECT COUNT(*) c FROM certificates WHERE status='approved'").get().c;
  const totalPortfolio = db.prepare("SELECT COUNT(*) c FROM portfolios WHERE status='approved'").get().c;
  const pendingSkill = db.prepare("SELECT COUNT(*) c FROM skills WHERE status='pending'").get().c;
  const pendingCertificate = db.prepare("SELECT COUNT(*) c FROM certificates WHERE status='pending'").get().c;
  const pendingPortfolio = db.prepare("SELECT COUNT(*) c FROM portfolios WHERE status='pending'").get().c;

  res.json({
    totalMahasiswa,
    totalSkill,
    totalCertificate,
    totalPortfolio,
    totalPendingSubmission: pendingSkill + pendingCertificate + pendingPortfolio
  });
});

// --- Data Mahasiswa + Search berdasarkan skill & poin ---
router.get('/students', (req, res) => {
  const { q, skill, minPoint } = req.query;
  let sql = "SELECT id,name,email,nim,prodi,angkatan,point FROM users WHERE role='mahasiswa'";
  const params = [];

  if (q) {
    sql += ' AND (name LIKE ? OR nim LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (minPoint) {
    sql += ' AND point >= ?';
    params.push(minPoint);
  }
  if (skill) {
    sql += " AND id IN (SELECT user_id FROM skills WHERE status='approved' AND name LIKE ?)";
    params.push(`%${skill}%`);
  }
  sql += ' ORDER BY point DESC';

  res.json(db.prepare(sql).all(...params));
});

router.get('/students/:id', (req, res) => {
  const student = db
    .prepare("SELECT id,name,email,nim,prodi,angkatan,bio,point FROM users WHERE id=? AND role='mahasiswa'")
    .get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });

  student.skills = db.prepare('SELECT * FROM skills WHERE user_id=? ORDER BY created_at DESC').all(req.params.id);
  student.certificates = db.prepare('SELECT * FROM certificates WHERE user_id=? ORDER BY created_at DESC').all(req.params.id);
  student.portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id=? ORDER BY created_at DESC').all(req.params.id);
  res.json(student);
});

// --- Verifikasi Skill / Sertifikat / Portofolio ---
const TABLES = { skill: 'skills', certificate: 'certificates', portfolio: 'portfolios' };

function suggestPoint(type, item) {
  if (type === 'certificate') {
    const map = { lokal: 1, regional: 3, nasional: 5, internasional: 10 };
    return map[item.level] || 1;
  }
  if (type === 'portfolio') {
    const map = { personal: 2, freelance: 5, industri: 8 };
    return map[item.type] || 2;
  }
  return 5; // default saran poin untuk skill, admin bebas mengubah
}

router.get('/submissions', (req, res) => {
  const { type = 'skill', status = 'pending' } = req.query;
  const table = TABLES[type];
  if (!table) return res.status(400).json({ error: 'Tipe tidak valid. Gunakan skill/certificate/portfolio.' });

  const rows = db
    .prepare(
      `SELECT s.*, u.name as student_name, u.nim FROM ${table} s
       JOIN users u ON u.id = s.user_id
       WHERE s.status = ? ORDER BY s.created_at DESC`
    )
    .all(status);
  res.json(rows);
});

router.post('/submissions/:type/:id/approve', (req, res) => {
  const { type, id } = req.params;
  const table = TABLES[type];
  if (!table) return res.status(400).json({ error: 'Tipe tidak valid.' });

  const item = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
  if (!item) return res.status(404).json({ error: 'Data pengajuan tidak ditemukan.' });

  const point = req.body.point !== undefined && req.body.point !== '' ? Number(req.body.point) : suggestPoint(type, item);
  const note = req.body.note || null;

  const tx = db.transaction(() => {
    db.prepare(`UPDATE ${table} SET status='approved', point=?, note=? WHERE id=?`).run(point, note, id);
    db.prepare('UPDATE users SET point = point + ? WHERE id=?').run(point, item.user_id);
  });
  tx();

  res.json({ message: 'Pengajuan disetujui dan poin diberikan.', point });
});

router.post('/submissions/:type/:id/reject', (req, res) => {
  const { type, id } = req.params;
  const table = TABLES[type];
  if (!table) return res.status(400).json({ error: 'Tipe tidak valid.' });

  const note = req.body.note || null;
  const info = db.prepare(`UPDATE ${table} SET status='rejected', note=? WHERE id=?`).run(note, id);
  if (info.changes === 0) return res.status(404).json({ error: 'Data pengajuan tidak ditemukan.' });

  res.json({ message: 'Pengajuan ditolak.' });
});

// --- Reward Management ---
router.get('/rewards', (req, res) => {
  res.json(db.prepare('SELECT * FROM rewards ORDER BY point_required ASC').all());
});

router.post('/rewards', (req, res) => {
  const { title, description, point_required, stock } = req.body;
  if (!title || !point_required) return res.status(400).json({ error: 'Judul dan poin dibutuhkan wajib diisi.' });
  const info = db
    .prepare('INSERT INTO rewards (title,description,point_required,stock) VALUES (?,?,?,?)')
    .run(title, description || null, point_required, stock || 0);
  res.json({ message: 'Reward berhasil ditambahkan.', id: info.lastInsertRowid });
});

router.put('/rewards/:id', (req, res) => {
  const { title, description, point_required, stock } = req.body;
  db.prepare('UPDATE rewards SET title=?,description=?,point_required=?,stock=? WHERE id=?').run(
    title, description, point_required, stock, req.params.id
  );
  res.json({ message: 'Reward berhasil diperbarui.' });
});

router.delete('/rewards/:id', (req, res) => {
  db.prepare('DELETE FROM rewards WHERE id=?').run(req.params.id);
  res.json({ message: 'Reward berhasil dihapus.' });
});

// --- Leaderboard ---
router.get('/leaderboard', (req, res) => {
  res.json(
    db.prepare("SELECT id,name,prodi,point FROM users WHERE role='mahasiswa' ORDER BY point DESC LIMIT 100").all()
  );
});

// --- Opportunity ---
router.get('/opportunities', (req, res) => {
  res.json(db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all());
});

router.post('/opportunities', (req, res) => {
  const { title, description, skill_tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Judul opportunity wajib diisi.' });
  const info = db
    .prepare('INSERT INTO opportunities (title,description,skill_tags,created_by) VALUES (?,?,?,?)')
    .run(title, description || null, skill_tags || null, req.user.id);
  res.json({ message: 'Opportunity berhasil diposting.', id: info.lastInsertRowid });
});

router.delete('/opportunities/:id', (req, res) => {
  db.prepare('DELETE FROM opportunities WHERE id=?').run(req.params.id);
  res.json({ message: 'Opportunity dihapus.' });
});

module.exports = router;
