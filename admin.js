// public/js/admin.js - logic dashboard admin
const user = requireAuth('admin');
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
    dashboard: loadStats,
    mahasiswa: loadStudents,
    verifikasi: loadSubmissions,
    reward: loadRewardsAdmin,
    leaderboard: loadLeaderboard,
    opportunity: loadOpportunities
  };
  if (map[page]) map[page]();
}

// ---------- Dashboard Stats ----------
async function loadStats() {
  const grid = document.getElementById('statGrid');
  try {
    const s = await apiFetch('/admin/dashboard/stats');
    grid.innerHTML = `
      <div class="card stat-card"><div class="value">${s.totalMahasiswa}</div><div class="label">Total Mahasiswa</div></div>
      <div class="card stat-card"><div class="value">${s.totalSkill}</div><div class="label">Skill Terverifikasi</div></div>
      <div class="card stat-card"><div class="value">${s.totalCertificate + s.totalPortfolio}</div><div class="label">Sertifikat + Portofolio</div></div>
      <div class="card stat-card"><div class="value">${s.totalPendingSubmission}</div><div class="label">Menunggu Verifikasi</div></div>
    `;
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Data Mahasiswa ----------
async function loadStudents() {
  const box = document.getElementById('studentList');
  const q = document.getElementById('searchQ')?.value || '';
  const skill = document.getElementById('searchSkill')?.value || '';
  const minPoint = document.getElementById('searchMinPoint')?.value || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (skill) params.set('skill', skill);
  if (minPoint) params.set('minPoint', minPoint);
  try {
    const rows = await apiFetch('/admin/students?' + params.toString());
    if (rows.length === 0) { box.innerHTML = '<div class="empty-state">Tidak ada mahasiswa ditemukan.</div>'; return; }
    box.innerHTML = `<table><thead><tr><th>Nama</th><th>NIM</th><th>Prodi</th><th>Angkatan</th><th>Poin</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${r.name}</td><td>${r.nim || '-'}</td><td>${r.prodi || '-'}</td><td>${r.angkatan || '-'}</td><td><b>${r.point}</b></td></tr>`).join('')}
    </tbody></table>`;
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Verifikasi ----------
async function loadSubmissions() {
  const box = document.getElementById('submissionList');
  const type = document.getElementById('verifType').value;
  const status = document.getElementById('verifStatus').value;
  try {
    const rows = await apiFetch(`/admin/submissions?type=${type}&status=${status}`);
    if (rows.length === 0) { box.innerHTML = '<div class="empty-state">Tidak ada data.</div>'; return; }
    box.innerHTML = rows.map(r => `
      <div style="padding:14px 0; border-bottom:1px solid var(--border);">
        <b>${r.title || r.name}</b> ${badge(r.status)}<br/>
        <span style="font-size:12px; color:var(--text-muted);">
          ${r.student_name} (${r.nim || '-'}) · ${type === 'certificate' ? 'Tingkat: ' + r.level : ''}${type === 'portfolio' ? 'Tipe: ' + r.type : ''}${type === 'skill' ? 'Kategori: ' + (r.category || '-') : ''} · ${fmtDate(r.created_at)}
        </span><br/>
        ${(r.proof_url || r.file_url) ? `<a href="${r.proof_url || r.file_url}" target="_blank" style="font-size:12px; color:var(--primary);">Lihat bukti file</a><br/>` : ''}
        ${status === 'pending' ? `
          <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
            <input type="number" placeholder="Poin" id="point-${type}-${r.id}" style="width:90px;" />
            <button class="btn small success" onclick="approveSubmission('${type}', ${r.id})">Setujui</button>
            <button class="btn small danger" onclick="rejectSubmission('${type}', ${r.id})">Tolak</button>
          </div>` : (r.note ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Catatan: ${r.note}</div>` : '')}
      </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

async function approveSubmission(type, id) {
  const pointInput = document.getElementById(`point-${type}-${id}`);
  const point = pointInput.value ? Number(pointInput.value) : undefined;
  try {
    await apiFetch(`/admin/submissions/${type}/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ point })
    });
    showMsg(msgBox, 'Pengajuan disetujui.', 'success');
    loadSubmissions();
  } catch (err) { showMsg(msgBox, err.message); }
}

async function rejectSubmission(type, id) {
  const note = prompt('Alasan penolakan (opsional):') || '';
  try {
    await apiFetch(`/admin/submissions/${type}/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    showMsg(msgBox, 'Pengajuan ditolak.', 'success');
    loadSubmissions();
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Reward Management ----------
async function loadRewardsAdmin() {
  const box = document.getElementById('rewardAdminList');
  try {
    const rewards = await apiFetch('/admin/rewards');
    box.innerHTML = rewards.length === 0 ? '<div class="empty-state">Belum ada reward.</div>' :
      rewards.map(r => `
        <div style="padding:10px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b>${r.title}</b><br/>
            <span style="font-size:12px; color:var(--text-muted);">${r.point_required} poin · stok ${r.stock}</span>
          </div>
          <button class="btn small danger" onclick="deleteReward(${r.id})">Hapus</button>
        </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

document.getElementById('rewardForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/admin/rewards', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('rTitle').value,
        description: document.getElementById('rDesc').value,
        point_required: Number(document.getElementById('rPoint').value),
        stock: Number(document.getElementById('rStock').value)
      })
    });
    showMsg(msgBox, 'Reward ditambahkan.', 'success');
    e.target.reset();
    loadRewardsAdmin();
  } catch (err) { showMsg(msgBox, err.message); }
});

async function deleteReward(id) {
  if (!confirm('Hapus reward ini?')) return;
  try {
    await apiFetch(`/admin/rewards/${id}`, { method: 'DELETE' });
    loadRewardsAdmin();
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Leaderboard ----------
async function loadLeaderboard() {
  const box = document.getElementById('leaderboardList');
  try {
    const rows = await apiFetch('/admin/leaderboard');
    if (rows.length === 0) { box.innerHTML = '<div class="empty-state">Belum ada data.</div>'; return; }
    box.innerHTML = rows.map((r, i) => `
      <div class="leaderboard-row">
        <div class="leaderboard-rank">${i + 1}</div>
        <div style="flex:1;"><b>${r.name}</b><br/><span style="font-size:12px; color:var(--text-muted);">${r.prodi || '-'}</span></div>
        <div style="font-weight:700; color:var(--primary);">${r.point} pts</div>
      </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

// ---------- Opportunity ----------
async function loadOpportunities() {
  const box = document.getElementById('oppList');
  try {
    const rows = await apiFetch('/admin/opportunities');
    box.innerHTML = rows.length === 0 ? '<div class="empty-state">Belum ada opportunity.</div>' :
      rows.map(o => `
        <div style="padding:10px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <b>${o.title}</b><br/>
            <span style="font-size:12px; color:var(--text-muted);">${o.description || ''}</span><br/>
            <div style="margin-top:4px;">${(o.skill_tags || '').split(',').filter(Boolean).map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>
          </div>
          <button class="btn small danger" onclick="deleteOpportunity(${o.id})">Hapus</button>
        </div>`).join('');
  } catch (err) { showMsg(msgBox, err.message); }
}

document.getElementById('oppForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/admin/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('oTitle').value,
        description: document.getElementById('oDesc').value,
        skill_tags: document.getElementById('oTags').value
      })
    });
    showMsg(msgBox, 'Opportunity berhasil diposting.', 'success');
    e.target.reset();
    loadOpportunities();
  } catch (err) { showMsg(msgBox, err.message); }
});

async function deleteOpportunity(id) {
  if (!confirm('Hapus opportunity ini?')) return;
  try {
    await apiFetch(`/admin/opportunities/${id}`, { method: 'DELETE' });
    loadOpportunities();
  } catch (err) { showMsg(msgBox, err.message); }
}

// Initial load
loadStats();
