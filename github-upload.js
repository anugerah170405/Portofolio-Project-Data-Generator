/* ══════════════════════════════════════════════════════
   github-upload.js
   Token & repo stored in localStorage — never in code.
   Click the GitHub button in the navbar to configure.
   ══════════════════════════════════════════════════════ */

/* ── Config: read/write localStorage ── */
const GH = {
    get token()  { return (localStorage.getItem('gh_token')  || '').trim(); },
    get repo()   { return (localStorage.getItem('gh_repo')   || '').trim(); },
    get branch() { return (localStorage.getItem('gh_branch') || 'main').trim(); },
    get folder() { return (localStorage.getItem('gh_folder') || 'assets/images').replace(/^\/|\/$/g, ''); },
    get configured() { return !!(this.token && this.repo); },
    save(token, repo, branch, folder) {
        localStorage.setItem('gh_token',  token);
        localStorage.setItem('gh_repo',   repo);
        localStorage.setItem('gh_branch', branch || 'main');
        localStorage.setItem('gh_folder', folder || 'assets/images');
    },
    clear() {
        ['gh_token','gh_repo','gh_branch','gh_folder'].forEach(k => localStorage.removeItem(k));
    },
};

/* ── Toast notification ── */
function showToast(msg, type = 'success') {
    const t = g('gh-toast');
    t.textContent = msg;
    t.className = 'gh-toast ' + type;
    t.style.opacity = '1';
    t.style.transform = 'translateY(0) translateX(-50%)';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(6px) translateX(-50%)';
    }, 3000);
}

/* ── Status badge ── */
function updateSettingsBadge() {
    const btn = g('gh-settings-btn');
    if (!btn) return;
    if (GH.configured) {
        btn.classList.add('configured');
        btn.title = 'GitHub connected: ' + GH.repo + ' \u2192 ' + GH.folder + '/';
    } else {
        btn.classList.remove('configured');
        btn.title = 'Klik untuk setup GitHub upload';
    }
}

/* ══════════════════════════════════════════════════════
   Settings Modal
   ══════════════════════════════════════════════════════ */
function buildSettingsModal() {
    if (g('gh-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'gh-modal';
    overlay.className = 'gh-modal-overlay';
    overlay.innerHTML = `
    <div class="gh-modal" role="dialog" aria-modal="true">
        <div class="gh-modal-header">
            <div class="gh-modal-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                GitHub Upload Settings
            </div>
            <button class="gh-modal-close" onclick="closeSettingsModal()">x</button>
        </div>
        <div class="gh-modal-body">
            <div class="gh-modal-info">
                Token disimpan di <strong>localStorage</strong> browser kamu saja &mdash; tidak pernah masuk ke kode atau repo.
            </div>
            <div class="gh-field">
                <label for="gh-input-token">Personal Access Token <a href="https://github.com/settings/tokens/new" target="_blank" class="gh-link">Buat token baru &nearr;</a></label>
                <div class="gh-input-wrap">
                    <input type="password" id="gh-input-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" autocomplete="off" spellcheck="false">
                    <button class="gh-eye-btn" onclick="toggleTokenVisibility()" title="Show/hide token">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </div>
                <div class="gh-field-hint">Scope yang dibutuhkan: <code>repo</code> atau <code>public_repo</code></div>
            </div>
            <div class="gh-field">
                <label for="gh-input-repo">Repository</label>
                <input type="text" id="gh-input-repo" placeholder="username/repo-name" autocomplete="off" spellcheck="false">
                <div class="gh-field-hint">Format: <code>username/repo-name</code></div>
            </div>
            <div class="gh-row2">
                <div class="gh-field">
                    <label for="gh-input-branch">Branch</label>
                    <input type="text" id="gh-input-branch" placeholder="main" autocomplete="off">
                </div>
                <div class="gh-field">
                    <label for="gh-input-folder">Folder tujuan</label>
                    <input type="text" id="gh-input-folder" placeholder="assets/images" autocomplete="off">
                </div>
            </div>
            <div class="gh-modal-status" id="gh-modal-status"></div>
        </div>
        <div class="gh-modal-footer">
            <button class="gh-btn-disconnect" id="gh-btn-disconnect" onclick="disconnectGitHub()">Disconnect</button>
            <div style="flex:1"></div>
            <button class="gh-btn-cancel" onclick="closeSettingsModal()">Batal</button>
            <button class="gh-btn-save" onclick="saveGitHubSettings()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Save &amp; Connect
            </button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSettingsModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && g('gh-modal') && g('gh-modal').classList.contains('open')) closeSettingsModal();
    });
}

function openSettingsModal() {
    buildSettingsModal();
    g('gh-input-token').value  = GH.token;
    g('gh-input-repo').value   = GH.repo;
    g('gh-input-branch').value = GH.branch;
    g('gh-input-folder').value = GH.folder;
    g('gh-modal-status').textContent = '';
    g('gh-modal-status').className = 'gh-modal-status';
    g('gh-btn-disconnect').style.display = GH.configured ? '' : 'none';
    g('gh-modal').classList.add('open');
    setTimeout(() => g('gh-input-token').focus(), 50);
}

function closeSettingsModal() {
    const m = g('gh-modal');
    if (m) m.classList.remove('open');
}

function toggleTokenVisibility() {
    const inp = g('gh-input-token');
    inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function saveGitHubSettings() {
    const token  = g('gh-input-token').value.trim();
    const repo   = g('gh-input-repo').value.trim();
    const branch = g('gh-input-branch').value.trim() || 'main';
    const folder = g('gh-input-folder').value.trim() || 'assets/images';
    const status = g('gh-modal-status');

    if (!token || !repo) {
        status.textContent = 'Token dan repository wajib diisi.';
        status.className = 'gh-modal-status error';
        return;
    }
    if (!repo.includes('/')) {
        status.textContent = 'Format repo harus: username/repo-name';
        status.className = 'gh-modal-status error';
        return;
    }
    status.textContent = 'Memverifikasi token...';
    status.className = 'gh-modal-status info';
    try {
        const resp = await fetch('https://api.github.com/repos/' + repo, {
            headers: { 'Authorization': 'token ' + token }
        });
        if (resp.status === 401) throw new Error('Token tidak valid atau sudah expired.');
        if (resp.status === 404) throw new Error('Repo tidak ditemukan atau token tidak punya akses.');
        if (!resp.ok) throw new Error('GitHub API error: ' + resp.status);
        GH.save(token, repo, branch, folder);
        updateSettingsBadge();
        status.textContent = 'Terhubung ke ' + repo;
        status.className = 'gh-modal-status success';
        g('gh-btn-disconnect').style.display = '';
        showToast('GitHub berhasil dihubungkan!');
        setTimeout(() => closeSettingsModal(), 1200);
    } catch (err) {
        status.textContent = err.message;
        status.className = 'gh-modal-status error';
    }
}

function disconnectGitHub() {
    if (!confirm('Hapus konfigurasi GitHub dari browser ini?')) return;
    GH.clear();
    updateSettingsBadge();
    closeSettingsModal();
    showToast('GitHub disconnected', 'error');
}

function initGitHubButton() {
    const btn = g('gh-settings-btn');
    if (!btn) return;
    btn.style.cursor = 'pointer';
    btn.onclick = openSettingsModal;
}

/* ── Local preview ── */
function previewLocal(file, onUrl) { onUrl(URL.createObjectURL(file)); }

/* ── Core upload ── */
async function uploadToGitHub(file) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = GH.folder + '/' + Date.now() + '_' + safe;
    const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
    const resp = await fetch('https://api.github.com/repos/' + GH.repo + '/contents/' + path, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + GH.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Upload ' + safe + ' via Project Generator', content: base64, branch: GH.branch }),
    });
    if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.message || 'GitHub API ' + resp.status); }
    return (await resp.json()).content.download_url;
}

/* ── Handle upload ── */
async function handleUpload(file, el, onUrl) {
    if (!file || !file.type.startsWith('image/')) { showToast('Only image files are supported', 'error'); return; }
    previewLocal(file, onUrl);
    if (!GH.configured) { showToast('Preview only — klik tombol GitHub untuk setup', 'error'); return; }
    el.classList.add('uploading');
    showToast('Uploading to GitHub...');
    try { const url = await uploadToGitHub(file); onUrl(url); showToast('Uploaded! Permanent URL inserted'); }
    catch (err) { showToast('Upload failed: ' + err.message, 'error'); }
    finally { el.classList.remove('uploading'); }
}

/* ── File picker ── */
function pickFile(onFile) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => { if (inp.files[0]) onFile(inp.files[0]); };
    inp.click();
}

/* ── Drop zones ── */
function makeDrop(el, onUrl) {
    if (el._dropReady) return; el._dropReady = true;
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over'); });
    el.addEventListener('drop', async e => { e.preventDefault(); el.classList.remove('drag-over'); await handleUpload(e.dataTransfer.files[0], el, onUrl); });
}

function initThumbDrop() {
    const wrap = g('thumb-drop-wrap'); if (!wrap) return;
    makeDrop(wrap, url => { g('f-thumb').value = url; liveUpdate(); });
    g('thumb-pick-btn').addEventListener('click', () => {
        pickFile(file => handleUpload(file, wrap, url => { g('f-thumb').value = url; liveUpdate(); }));
    });
}

function initAvatarDrop(cell, idx) {
    makeDrop(cell, url => { syncAuthors(); authors[idx].avatar = url; renderAuthors(); liveUpdate(); });
    const pickBtn = cell.querySelector('.drop-pick-btn');
    if (pickBtn && !pickBtn._pickReady) {
        pickBtn._pickReady = true;
        pickBtn.addEventListener('click', () => {
            pickFile(file => handleUpload(file, cell, url => { syncAuthors(); authors[idx].avatar = url; renderAuthors(); liveUpdate(); }));
        });
    }
}

function initMdDrop(wrapId, taId) {
    const wrap = g(wrapId), ta = g(taId); if (!wrap || !ta) return;
    wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('drag-over'); });
    wrap.addEventListener('dragleave', e => { if (!wrap.contains(e.relatedTarget)) wrap.classList.remove('drag-over'); });
    wrap.addEventListener('drop', async e => { e.preventDefault(); wrap.classList.remove('drag-over'); await handleMdImageUpload(e.dataTransfer.files[0], wrap, ta); });
}

async function handleMdImageUpload(file, wrap, ta) {
    if (!file || !file.type.startsWith('image/')) { showToast('Only image files are supported', 'error'); return; }
    const altText = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
    const blobUrl = URL.createObjectURL(file);
    insertMdImageAt(ta, altText, blobUrl);
    if (!GH.configured) { showToast('Preview only — klik tombol GitHub untuk setup', 'error'); return; }
    wrap.classList.add('uploading'); showToast('Uploading to GitHub...');
    try {
        const url = await uploadToGitHub(file);
        ta.value = ta.value.replace(blobUrl, url);
        liveUpdate(); showToast('Uploaded! Image link inserted');
    } catch (err) { showToast('Upload failed: ' + err.message, 'error'); }
    finally { wrap.classList.remove('uploading'); }
}

function insertMdImageAt(ta, alt, url) {
    const pos = ta.selectionStart, before = ta.value.slice(0, pos), after = ta.value.slice(pos);
    const prefix = (before.length > 0 && !before.endsWith('\n')) ? '\n' : '';
    const snippet = prefix + '![' + alt + '](' + url + ')\n';
    ta.value = before + snippet + after;
    ta.selectionStart = ta.selectionEnd = pos + snippet.length;
    ta.focus(); liveUpdate();
}

function initAllMdDrops() {
    initMdDrop('md-wrap-challenge', 'f-challenge');
    initMdDrop('md-wrap-solution',  'f-solution');
    initMdDrop('md-wrap-result',    'f-result');
}

/* ── Init ── */
window.addEventListener('load', () => {
    initGitHubButton();
    if (typeof initThumbDrop  === 'function') initThumbDrop();
    if (typeof initAllMdDrops === 'function') initAllMdDrops();
    updateSettingsBadge();
});
