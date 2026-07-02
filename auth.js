// src/middleware/auth.js
// Middleware untuk verifikasi JWT token dan pembatasan akses berdasarkan role.
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token tidak ditemukan, silakan login.' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ganti_dengan_secret_yang_kuat');
    req.user = decoded; // { id, role, name }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Akses ditolak untuk role ini.' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
