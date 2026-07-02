// public/js/api.js
// Helper untuk komunikasi ke backend API + manajemen sesi login (token JWT).
const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch (e) { return null; }
}
function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan pada server.');
  return data;
}

// Redirect ke login jika belum login / role tidak sesuai halaman
function requireAuth(role) {
  const token = getToken();
  const user = getUser();
  if (!token || !user || (role && user.role !== role)) {
    window.location.href = '/index.html';
    return null;
  }
  return user;
}

function logout() {
  clearSession();
  window.location.href = '/index.html';
}

function showMsg(container, text, type = 'error') {
  container.innerHTML = `<div class="msg ${type}">${text}</div>`;
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

function fmtDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badge(status) {
  const label = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[status] || status;
  return `<span class="badge ${status}">${label}</span>`;
}
