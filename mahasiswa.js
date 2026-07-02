// public/js/mahasiswa.js - logic dashboard mahasiswa
const user = requireAuth('mahasiswa');
if (user) document.getElementById('sidebarUserName').textContent = user.name;

const msgBox = document.getElementById('msgBox');

// ---------- Navigation ----------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.page-section').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + btn.dataset.page).classList.add('active');
    loadPage(btn.dataset.page);
  });
});

function loadPage(page) {
  const map = {
    profil: loadProfile,
    skill: loadSkills,
    sertifikat: loadCertificates,
    portofolio: loadPortfolios,
    status: loadStatus,
    leaderboard: loadLeaderboard,
    reward: loadRewards,
    rekomendasi: loadRecommendations
  };
  if (map[page]) map[page]();
}

// ---------- Profil ----------
async function loadProfile() {
  try {
    const p = await apiFetch('/mahasiswa/profile');
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pNim').value = p.nim || '';
    document.getElementById('pProdi').value = p.prodi || '';
    document.getElementById('pAngkatan').value = p.angkatan || '';
    document.getElementById('pBio').value = p.bio || '';
    document.getElementById('profilPointBox').innerHTML =
      `<div class="stat-card"><div class="value">${p.point}</div><div class="label">Total Poin Kamu</div></div>`;
  } catch (err) { showMsg(msgBox, err.message); }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/mahasiswa/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('pName').value,
        nim: document.getElementById('pNim').value,
        prodi: document.getElementById('pProdi').value,
        angkatan: document.getElementById('pAngkatan').value,
        bio: document.getElementById('pBio').value
      })
    });
    showMsg(msgBox, 'Profil berhasil disimpan.', 'success');
  } catch (err) { showMsg(msgBox, err.message); }
});

// ---------- Skill ----------
async function loadSkills() {
  const list = document.getElementById('skillList');
  try {
    const skills = await apiFetch('/mahasiswa/skills');
    if (skills.length === 0) { list.innerHTML = '<div class="empty-state">Belum ada skill diajukan.</div>'; return; }
    list.innerHTML = skills.map(s => `
      <div style="padding:10px 0; border-bottom:1px solid var(--border);">
        <b>${s.name}</b> ${badge(s.status)}<br/>
        <span style="font-size:12px; color:var(--text-muted);">${s.category || '-'} · ${fmtDate(s.created_at)} ${s.status === 'approved' ? `· +${s.point} poin` : ''}</span>
        ${s.note ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Catatan admin: ${s.note}</div>` : ''}
      </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

document.getElementById('skillForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('name', document.getElementById('sName').value);
  fd.append('category', document.getElementById('sCategory').value);
  const file = document.getElementById('sProof').files[0];
  if (file) fd.append('proof', file);
  try {
    await apiFetch('/mahasiswa/skills', { method: 'POST', body: fd });
    showMsg(msgBox, 'Skill berhasil diajukan.', 'success');
    e.target.reset();
    loadSkills();
  } catch (err) { showMsg(msgBox, err.message); }
});

// ---------- Sertifikat ----------
async function loadCertificates() {
  const list = document.getElementById('certList');
  try {
    const certs = await apiFetch('/mahasiswa/certificates');
    if (certs.length === 0) { list.innerHTML = '<div class="empty-state">Belum ada sertifikat diajukan.</div>'; return; }
    list.innerHTML = certs.map(c => `
      <div style="padding:10px 0; border-bottom:1px solid var(--border);">
        <b>${c.title}</b> ${badge(c.status)}<br/>
        <span style="font-size:12px; color:var(--text-muted);">Tingkat: ${c.level} · ${fmtDate(c.created_at)} ${c.status === 'approved' ? `· +${c.point} poin` : ''}</span>
        ${c.note ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Catatan admin: ${c.note}</div>` : ''}
      </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

document.getElementById('certForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('title', document.getElementById('cTitle').value);
  fd.append('level', document.getElementById('cLevel').value);
  const file = document.getElementById('cFile').files[0];
  if (file) fd.append('file', file);
  try {
    await apiFetch('/mahasiswa/certificates', { method: 'POST', body: fd });
    showMsg(msgBox, 'Sertifikat berhasil diajukan.', 'success');
    e.target.reset();
    loadCertificates();
  } catch (err) { showMsg(msgBox, err.message); }
});

// ---------- Portofolio ----------
async function loadPortfolios() {
  const list = document.getElementById('portoList');
  try {
    const ports = await apiFetch('/mahasiswa/portfolios');
    if (ports.length === 0) { list.innerHTML = '<div class="empty-state">Belum ada portofolio diajukan.</div>'; return; }
    list.innerHTML = ports.map(p => `
      <div style="padding:10px 0; border-bottom:1px solid var(--border);">
        <b>${p.title}</b> ${badge(p.status)}<br/>
        <span style="font-size:12px; color:var(--text-muted);">Tipe: ${p.type} · ${fmtDate(p.created_at)} ${p.status === 'approved' ? `· +${p.point} poin` : ''}</span>
        ${p.note ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Catatan admin: ${p.note}</div>` : ''}
      </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

document.getElementById('portoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('title', document.getElementById('poTitle').value);
  fd.append('type', document.getElementById('poType').value);
  fd.append('description', document.getElementById('poDesc').value);
  const file = document.getElementById('poFile').files[0];
  if (file) fd.append('file', file);
  try {
    await apiFetch('/mahasiswa/portfolios', { method: 'POST', body: fd });
    showMsg(msgBox, 'Portofolio berhasil diajukan.', 'success');
    e.target.reset();
    loadPortfolios();
  } catch (err) { showMsg(msgBox, err.message); }
});

// ---------- Status Pengajuan ----------
async function loadStatus() {
  const box = document.getElementById('statusList');
  try {
    const rows = await apiFetch('/mahasiswa/submissions');
    if (rows.length === 0) { box.innerHTML = '<div class="empty-state">Belum ada pengajuan.</div>'; return; }
    box.innerHTML = `<table><thead><tr><th>Tipe</th><th>Judul</th><th>Status</th><th>Poin</th><th>Tanggal</th></tr></thead><tbody>
      ${rows.map(r => `<tr>
        <td>${{skill:'Skill', certificate:'Sertifikat', portfolio:'Portofolio'}[r.type]}</td>
        <td>${r.title}</td>
        <td>${badge(r.status)}</td>
        <td>${r.status === 'approved' ? '+' + r.point : '-'}</td>
        <td>${fmtDate(r.created_at)}</td>
      </tr>`).join('')}
    </tbody></table>`;
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Leaderboard ----------
async function loadLeaderboard() {
  const box = document.getElementById('leaderboardList');
  try {
    const rows = await apiFetch('/mahasiswa/leaderboard');
    if (rows.length === 0) { box.innerHTML = '<div class="empty-state">Belum ada data.</div>'; return; }
    box.innerHTML = rows.map((r, i) => `
      <div class="leaderboard-row">
        <div class="leaderboard-rank">${i + 1}</div>
        <div style="flex:1;">
          <b>${r.name}</b> ${r.id === user.id ? '<span class="tag">Kamu</span>' : ''}<br/>
          <span style="font-size:12px; color:var(--text-muted);">${r.prodi || '-'}</span>
        </div>
        <div style="font-weight:700; color:var(--primary);">${r.point} pts</div>
      </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Reward ----------
async function loadRewards() {
  const grid = document.getElementById('rewardGrid');
  const claimBox = document.getElementById('claimList');
  try {
    const [rewards, profile, claims] = await Promise.all([
      apiFetch('/mahasiswa/rewards'),
      apiFetch('/mahasiswa/profile'),
      apiFetch('/mahasiswa/my-claims')
    ]);
    grid.innerHTML = rewards.map(r => `
      <div class="card reward-card">
        <b>${r.title}</b>
        <span style="font-size:12px; color:var(--text-muted);">${r.description || ''}</span>
        <span class="point-req">${r.point_required} poin</span>
        <span style="font-size:12px; color:var(--text-muted);">Stok: ${r.stock}</span>
        <button class="btn small" ${profile.point < r.point_required || r.stock <= 0 ? 'disabled style="opacity:0.5;"' : ''} onclick="claimReward(${r.id})">Klaim</button>
      </div>`).join('');

    claimBox.innerHTML = claims.length === 0
      ? '<div class="empty-state">Belum ada reward yang diklaim.</div>'
      : `<table><thead><tr><th>Reward</th><th>Poin</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>
          ${claims.map(c => `<tr><td>${c.title}</td><td>${c.point_required}</td><td>${badge(c.status === 'claimed' ? 'approved' : c.status)}</td><td>${fmtDate(c.created_at)}</td></tr>`).join('')}
        </tbody></table>`;
  } catch (err) { showMsg(msgBox, err.message); }
}

async function claimReward(id) {
  try {
    await apiFetch(`/mahasiswa/rewards/${id}/claim`, { method: 'POST' });
    showMsg(msgBox, 'Reward berhasil diklaim!', 'success');
    loadRewards();
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Rekomendasi AI ----------
async function loadRecommendations() {
  const box = document.getElementById('recoBox');
  try {
    const data = await apiFetch('/mahasiswa/recommendations');
    let html = `<div class="msg success" style="background:#eef2ff; color:var(--primary);">${data.message}</div>`;
    if (data.recommendations.length > 0) {
      html += '<div class="grid grid-2">' + data.recommendations.map(op => `
        <div class="card">
          <b>${op.title}</b>
          <p style="font-size:13px; color:var(--text-muted);">${op.description || ''}</p>
          <div>${(op.matchedSkills || []).map(s => `<span class="tag">${s}</span>`).join('')}</div>
          <div style="font-size:12px; margin-top:6px; color:var(--success); font-weight:600;">Kecocokan: ${op.matchScore} skill</div>
        </div>`).join('') + '</div>';
    }
    box.innerHTML = html;
  } catch (err) { showMsg(msgBox, err.message); }
}

// Initial load
loadProfile();
