// src/utils/recommend.js
// Fitur "AI Recommendation": mencocokkan skill mahasiswa (yang sudah approved)
// dengan opportunity yang tersedia menggunakan keyword matching + scoring.
//
// Catatan: ini adalah rule-based engine yang berjalan offline (tanpa API key),
// cocok untuk demo hackathon. Bisa dengan mudah diganti/ditingkatkan dengan
// memanggil LLM API (mis. Anthropic API) untuk matching semantik yang lebih pintar -
// tinggal ganti isi fungsi getRecommendations dengan pemanggilan API di sana.

const db = require('../db');

function getRecommendations(userId) {
  const skills = db
    .prepare("SELECT name FROM skills WHERE user_id=? AND status='approved'")
    .all(userId)
    .map((s) => s.name.toLowerCase().trim());

  const opportunities = db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all();

  if (skills.length === 0) {
    return {
      message: 'Lengkapi dan ajukan skill Anda untuk verifikasi agar mendapat rekomendasi opportunity yang lebih akurat.',
      recommendations: []
    };
  }

  const scored = opportunities
    .map((op) => {
      const tags = (op.skill_tags || '')
        .toLowerCase()
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const matched = tags.filter((tag) =>
        skills.some((sk) => sk.includes(tag) || tag.includes(sk))
      );

      return { ...op, matchScore: matched.length, matchedSkills: matched };
    })
    .filter((op) => op.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    message:
      scored.length > 0
        ? 'Rekomendasi berikut dihasilkan berdasarkan kecocokan skill Anda yang sudah terverifikasi dengan opportunity yang tersedia.'
        : 'Belum ada opportunity yang cocok dengan skill Anda saat ini. Coba tambah skill lain.',
    recommendations: scored
  };
}

module.exports = { getRecommendations };
