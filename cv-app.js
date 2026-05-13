/* ══════════════════════════════════════════════════════
   cv-app.js
   Handles CV Data tab, collapsible panels, tab switching.
   ══════════════════════════════════════════════════════ */

/* ── App tab state ── */
let currentAppTab = 'project'; // 'project' | 'cv'

/* ── CV state ── */
let cvExperience = [];
let cvEducation  = [];
let cvAwards     = [];

/* ─────────────────────────────────────────────
   Panel collapse
───────────────────────────────────────────── */
const panelState = { left: true, right: true };

function togglePanel(side) {
    panelState[side] = !panelState[side];
    applyPanelState();
}

function applyPanelState() {
    const layout = document.getElementById('app-layout');
    const sidebar = document.getElementById('sidebar');
    const rightPanel = document.getElementById('right-panel');
    const btnLeft  = document.getElementById('btn-collapse-left');
    const btnRight = document.getElementById('btn-collapse-right');

    let cols = '';
    const leftW  = panelState.left  ? '220px' : '0px';
    const rightW = panelState.right ? '340px' : '0px';
    cols = `${leftW} 1fr ${rightW}`;
    layout.style.gridTemplateColumns = cols;

    sidebar.style.overflow   = panelState.left  ? '' : 'hidden';
    rightPanel.style.overflow = panelState.right ? '' : 'hidden';
    sidebar.style.borderRight    = panelState.left  ? '' : 'none';
    rightPanel.style.borderLeft  = panelState.right ? '' : 'none';

    btnLeft.classList.toggle('active', !panelState.left);
    btnRight.classList.toggle('active', !panelState.right);
}

/* ─────────────────────────────────────────────
   App tab switching (Project / CV)
───────────────────────────────────────────── */
function switchAppTab(tab) {
    currentAppTab = tab;

    document.getElementById('tab-project').style.display = tab === 'project' ? '' : 'none';
    document.getElementById('tab-cv').style.display      = tab === 'cv'      ? '' : 'none';

    document.getElementById('sidebar-project').style.display = tab === 'project' ? '' : 'none';
    document.getElementById('sidebar-cv').style.display      = tab === 'cv'      ? '' : 'none';

    document.getElementById('tab-btn-project').classList.toggle('active', tab === 'project');
    document.getElementById('tab-btn-cv').classList.toggle('active', tab === 'cv');

    // update subtitle
    document.getElementById('topbar-subtitle').textContent =
        tab === 'project' ? 'for ProjectData.ts' : 'for CV_DATA.ts';

    // update copy button label
    document.getElementById('btn-copy-label').textContent =
        tab === 'project' ? 'Copy TypeScript' : 'Copy CV_DATA';

    // right panel: show correct preview
    document.getElementById('rp-preview-project').style.display = tab === 'project' ? '' : 'none';
    document.getElementById('rp-preview-cv').style.display      = tab === 'cv'      ? '' : 'none';

    // trigger live updates
    if (tab === 'cv') cvLiveUpdate();
    else liveUpdate();
}

/* ─────────────────────────────────────────────
   Route topbar buttons based on active tab
───────────────────────────────────────────── */
function handleReset() {
    if (currentAppTab === 'project') { resetForm(); }
    else { resetCvForm(); }
}

function handleCopyMain() {
    if (currentAppTab === 'project') { copyOutput(); }
    else { copyCvSection('all'); }
}

/* ─────────────────────────────────────────────
   Scroll helpers
───────────────────────────────────────────── */
function scrollCvSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─────────────────────────────────────────────
   CV helpers
───────────────────────────────────────────── */
function cvVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function escCv(s) {
    return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getSkillsArray() {
    const raw = document.getElementById('cv-skills').value;
    return raw.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
}

/* ─────────────────────────────────────────────
   Experience
───────────────────────────────────────────── */
function syncCvExperience() {
    document.querySelectorAll('#cv-experience-list .cv-entry').forEach((row, i) => {
        const inputs   = row.querySelectorAll('input[type=text]');
        const textarea = row.querySelector('textarea');
        const checkbox = row.querySelector('input[type=checkbox]');
        const tagsEl   = row.querySelector('.cv-entry-tags-input');
        cvExperience[i].period   = inputs[0] ? inputs[0].value : '';
        cvExperience[i].role     = inputs[1] ? inputs[1].value : '';
        cvExperience[i].company  = inputs[2] ? inputs[2].value : '';
        cvExperience[i].location = inputs[3] ? inputs[3].value : '';
        cvExperience[i].current  = checkbox ? checkbox.checked : false;
        cvExperience[i].desc     = textarea ? textarea.value.trim() : '';
        if (tagsEl) {
            cvExperience[i].tags = tagsEl.value.split(',').map(t => t.trim()).filter(Boolean);
        }
    });
}

function addCvExperience() {
    syncCvExperience();
    cvExperience.push({ period: '', role: '', company: '', location: '', current: false, desc: '', tags: [] });
    renderCvExperience();
    cvLiveUpdate();
}

function removeCvExperience(i) {
    syncCvExperience();
    cvExperience.splice(i, 1);
    renderCvExperience();
    cvLiveUpdate();
}

function renderCvExperience() {
    const list = document.getElementById('cv-experience-list');
    list.innerHTML = cvExperience.map((e, i) => `
    <div class="cv-entry" data-idx="${i}">
        <div class="cv-entry-header">
            <span class="cv-entry-num">${i + 1}</span>
            <label class="cv-entry-current">
                <input type="checkbox" ${e.current ? 'checked' : ''} onchange="cvExperience[${i}].current=this.checked;cvLiveUpdate()">
                Current
            </label>
            <button class="rm-btn" onclick="removeCvExperience(${i})" aria-label="remove">×</button>
        </div>
        <div class="row2">
            <div class="field"><label>Period</label>
                <input type="text" placeholder="2024 – Present" value="${escAttr(e.period)}" oninput="cvExperience[${i}].period=this.value;cvLiveUpdate()"></div>
            <div class="field"><label>Role</label>
                <input type="text" placeholder="Senior Designer" value="${escAttr(e.role)}" oninput="cvExperience[${i}].role=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="row2">
            <div class="field"><label>Company</label>
                <input type="text" placeholder="Company Name" value="${escAttr(e.company)}" oninput="cvExperience[${i}].company=this.value;cvLiveUpdate()"></div>
            <div class="field"><label>Location</label>
                <input type="text" placeholder="Jakarta, Indonesia" value="${escAttr(e.location)}" oninput="cvExperience[${i}].location=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="field"><label>Description</label>
            <textarea oninput="cvExperience[${i}].desc=this.value;autoGrow(this);cvLiveUpdate()" placeholder="Describe your role and achievements…">${escHtml(e.desc)}</textarea>
        </div>
        <div class="field"><label>Tags (comma-separated)</label>
            <input type="text" class="cv-entry-tags-input" placeholder="Figma, React, TypeScript" value="${escAttr((e.tags || []).join(', '))}" oninput="cvExperience[${i}].tags=this.value.split(',').map(t=>t.trim()).filter(Boolean);cvLiveUpdate()">
        </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────
   Education
───────────────────────────────────────────── */
function syncCvEducation() {
    document.querySelectorAll('#cv-education-list .cv-entry').forEach((row, i) => {
        const inputs   = row.querySelectorAll('input[type=text]');
        const textarea = row.querySelector('textarea');
        cvEducation[i].period    = inputs[0] ? inputs[0].value : '';
        cvEducation[i].degree    = inputs[1] ? inputs[1].value : '';
        cvEducation[i].school    = inputs[2] ? inputs[2].value : '';
        cvEducation[i].location  = inputs[3] ? inputs[3].value : '';
        cvEducation[i].highlight = inputs[4] ? inputs[4].value : '';
        cvEducation[i].desc      = textarea ? textarea.value.trim() : '';
    });
}

function addCvEducation() {
    syncCvEducation();
    cvEducation.push({ period: '', degree: '', school: '', location: '', desc: '', highlight: '' });
    renderCvEducation();
    cvLiveUpdate();
}

function removeCvEducation(i) {
    syncCvEducation();
    cvEducation.splice(i, 1);
    renderCvEducation();
    cvLiveUpdate();
}

function renderCvEducation() {
    const list = document.getElementById('cv-education-list');
    list.innerHTML = cvEducation.map((e, i) => `
    <div class="cv-entry" data-idx="${i}">
        <div class="cv-entry-header">
            <span class="cv-entry-num">${i + 1}</span>
            <button class="rm-btn" onclick="removeCvEducation(${i})" aria-label="remove">×</button>
        </div>
        <div class="row2">
            <div class="field"><label>Period</label>
                <input type="text" placeholder="2018 – 2022" value="${escAttr(e.period)}" oninput="cvEducation[${i}].period=this.value;cvLiveUpdate()"></div>
            <div class="field"><label>Degree</label>
                <input type="text" placeholder="Bachelor of Visual Communication Design" value="${escAttr(e.degree)}" oninput="cvEducation[${i}].degree=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="row2">
            <div class="field"><label>School</label>
                <input type="text" placeholder="Universitas Bina Nusantara" value="${escAttr(e.school)}" oninput="cvEducation[${i}].school=this.value;cvLiveUpdate()"></div>
            <div class="field"><label>Location</label>
                <input type="text" placeholder="Jakarta, Indonesia" value="${escAttr(e.location)}" oninput="cvEducation[${i}].location=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="row2">
            <div class="field"><label>Highlight</label>
                <input type="text" placeholder="GPA 3.85 / 4.00" value="${escAttr(e.highlight)}" oninput="cvEducation[${i}].highlight=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="field"><label>Description</label>
            <textarea oninput="cvEducation[${i}].desc=this.value;autoGrow(this);cvLiveUpdate()" placeholder="Describe the program…">${escHtml(e.desc)}</textarea>
        </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────
   Awards
───────────────────────────────────────────── */
function syncCvAwards() {
    document.querySelectorAll('#cv-awards-list .cv-entry').forEach((row, i) => {
        const inputs   = row.querySelectorAll('input[type=text]');
        const textarea = row.querySelector('textarea');
        cvAwards[i].year  = inputs[0] ? inputs[0].value : '';
        cvAwards[i].title = inputs[1] ? inputs[1].value : '';
        cvAwards[i].org   = inputs[2] ? inputs[2].value : '';
        cvAwards[i].type  = inputs[3] ? inputs[3].value : '';
        cvAwards[i].desc  = textarea ? textarea.value.trim() : '';
    });
}

function addCvAward() {
    syncCvAwards();
    cvAwards.push({ year: '', title: '', org: '', type: '', desc: '' });
    renderCvAwards();
    cvLiveUpdate();
}

function removeCvAward(i) {
    syncCvAwards();
    cvAwards.splice(i, 1);
    renderCvAwards();
    cvLiveUpdate();
}

function renderCvAwards() {
    const list = document.getElementById('cv-awards-list');
    list.innerHTML = cvAwards.map((a, i) => `
    <div class="cv-entry" data-idx="${i}">
        <div class="cv-entry-header">
            <span class="cv-entry-num">${i + 1}</span>
            <button class="rm-btn" onclick="removeCvAward(${i})" aria-label="remove">×</button>
        </div>
        <div class="row2">
            <div class="field"><label>Year</label>
                <input type="text" placeholder="2024" value="${escAttr(a.year)}" oninput="cvAwards[${i}].year=this.value;cvLiveUpdate()"></div>
            <div class="field"><label>Type / Badge</label>
                <input type="text" placeholder="🥇 Gold" value="${escAttr(a.type)}" oninput="cvAwards[${i}].type=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="row2">
            <div class="field"><label>Title</label>
                <input type="text" placeholder="Best UI Design — Event Name" value="${escAttr(a.title)}" oninput="cvAwards[${i}].title=this.value;cvLiveUpdate()"></div>
            <div class="field"><label>Organization</label>
                <input type="text" placeholder="Organizer Name" value="${escAttr(a.org)}" oninput="cvAwards[${i}].org=this.value;cvLiveUpdate()"></div>
        </div>
        <div class="field"><label>Description</label>
            <textarea oninput="cvAwards[${i}].desc=this.value;autoGrow(this);cvLiveUpdate()" placeholder="Describe the award…">${escHtml(a.desc)}</textarea>
        </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────
   CV TypeScript generation
───────────────────────────────────────────── */
function buildCvObj() {
    return {
        name:       cvVal('cv-name'),
        role:       cvVal('cv-role'),
        location:   cvVal('cv-location'),
        email:      cvVal('cv-email'),
        website:    cvVal('cv-website'),
        profile:    document.getElementById('cv-profile').value.trim(),
        experience: cvExperience.map(e => ({...e})),
        education:  cvEducation.map(e => ({...e})),
        awards:     cvAwards.map(a => ({...a})),
        skills:     getSkillsArray(),
    };
}

function cvObjToTS(cv, mode = 'all') {
    const q = s => `"${escCv(s)}"`;
    const tplEsc = s => (s || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

    const identityStr = `  name: ${q(cv.name)},
  role: ${q(cv.role)},
  location: ${q(cv.location)},
  email: ${q(cv.email)},
  website: ${q(cv.website)},
  profile: \`${tplEsc(cv.profile)}\`,`;

    const expStr = `  experience: [\n${cv.experience.map(e => `    {
      period: ${q(e.period)},
      role: ${q(e.role)},
      company: ${q(e.company)},
      location: ${q(e.location)},
      current: ${e.current ? 'true' : 'false'},
      desc: ${q(e.desc)},
      tags: [${(e.tags||[]).map(t => q(t)).join(', ')}],
    },`).join('\n')}\n  ],`;

    const eduStr = `  education: [\n${cv.education.map(e => `    {
      period: ${q(e.period)},
      degree: ${q(e.degree)},
      school: ${q(e.school)},
      location: ${q(e.location)},
      desc: ${q(e.desc)},
      highlight: ${q(e.highlight)},
    },`).join('\n')}\n  ],`;

    const awdStr = `  awards: [\n${cv.awards.map(a => `    {
      year: ${q(a.year)},
      title: ${q(a.title)},
      org: ${q(a.org)},
      desc: ${q(a.desc)},
      type: ${q(a.type)},
    },`).join('\n')}\n  ],`;

    const skillsStr = `  skills: [\n    ${cv.skills.map(s => q(s)).join(', ')}\n  ],`;

    if (mode === 'identity') return `{\n${identityStr}\n}`;
    if (mode === 'experience') return `experience: [\n${cv.experience.map(e => `  {
    period: ${q(e.period)},
    role: ${q(e.role)},
    company: ${q(e.company)},
    location: ${q(e.location)},
    current: ${e.current ? 'true' : 'false'},
    desc: ${q(e.desc)},
    tags: [${(e.tags||[]).map(t => q(t)).join(', ')}],
  },`).join('\n')}\n]`;
    if (mode === 'education') return `education: [\n${cv.education.map(e => `  {
    period: ${q(e.period)},
    degree: ${q(e.degree)},
    school: ${q(e.school)},
    location: ${q(e.location)},
    desc: ${q(e.desc)},
    highlight: ${q(e.highlight)},
  },`).join('\n')}\n]`;
    if (mode === 'awards') return `awards: [\n${cv.awards.map(a => `  {
    year: ${q(a.year)},
    title: ${q(a.title)},
    org: ${q(a.org)},
    desc: ${q(a.desc)},
    type: ${q(a.type)},
  },`).join('\n')}\n]`;
    if (mode === 'skills') return `skills: [\n  ${cv.skills.map(s => q(s)).join(',\n  ')}\n]`;

    // all
    return `export const CV_DATA = {\n${identityStr}\n${expStr}\n${eduStr}\n${awdStr}\n${skillsStr}\n};\nexport type CVData = typeof CV_DATA;`;
}

/* ─────────────────────────────────────────────
   Copy CV section
───────────────────────────────────────────── */
function copyCvSection(mode) {
    const cv = buildCvObj();
    const text = cvObjToTS(cv, mode);
    navigator.clipboard.writeText(text).then(() => {
        const b = document.getElementById('copy-badge');
        b.style.display = 'inline-flex';
        setTimeout(() => b.style.display = 'none', 2500);
        if (typeof showToast === 'function') showToast('Copied ' + (mode === 'all' ? 'CV_DATA' : mode) + ' to clipboard!');
    }).catch(() => {
        if (typeof showToast === 'function') showToast('Copy failed', 'error');
    });
}

/* ─────────────────────────────────────────────
   CV Live Update
───────────────────────────────────────────── */
function cvLiveUpdate() {
    const cv = buildCvObj();
    renderCvPreview(cv);
    if (rightTab === 'output') renderCvOutput(cv);
}

function renderCvPreview(cv) {
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    setText('cvp-name',    cv.name);
    setText('cvp-role',    cv.role);
    setText('cvp-location',cv.location);
    setText('cvp-email',   cv.email);
    setText('cvp-website', cv.website);
    setText('cvp-profile', cv.profile);

    setText('cvp-exp-count', cv.experience.length);
    const expList = document.getElementById('cvp-exp-list');
    if (expList) expList.innerHTML = cv.experience.map(e =>
        `<div class="cv-prev-item"><div class="cv-prev-item-top"><span class="cv-prev-item-label">${escHtml(e.role || '—')}</span><span class="cv-prev-item-period">${escHtml(e.period)}</span></div><div class="cv-prev-item-sub">${escHtml(e.company)}${e.location ? ' · ' + escHtml(e.location) : ''}${e.current ? ' <span class="cv-badge">Current</span>' : ''}</div></div>`
    ).join('');

    setText('cvp-edu-count', cv.education.length);
    const eduList = document.getElementById('cvp-edu-list');
    if (eduList) eduList.innerHTML = cv.education.map(e =>
        `<div class="cv-prev-item"><div class="cv-prev-item-top"><span class="cv-prev-item-label">${escHtml(e.degree || '—')}</span><span class="cv-prev-item-period">${escHtml(e.period)}</span></div><div class="cv-prev-item-sub">${escHtml(e.school)}${e.highlight ? ' · <em>' + escHtml(e.highlight) + '</em>' : ''}</div></div>`
    ).join('');

    setText('cvp-awd-count', cv.awards.length);
    const awdList = document.getElementById('cvp-awd-list');
    if (awdList) awdList.innerHTML = cv.awards.map(a =>
        `<div class="cv-prev-item"><div class="cv-prev-item-top"><span class="cv-prev-item-label">${escHtml(a.title || '—')}</span><span class="cv-prev-item-period">${escHtml(a.year)}</span></div><div class="cv-prev-item-sub">${escHtml(a.org)}${a.type ? ' · ' + escHtml(a.type) : ''}</div></div>`
    ).join('');

    const skillsEl = document.getElementById('cvp-skills');
    if (skillsEl) skillsEl.innerHTML = cv.skills.map(s =>
        `<span class="prev-tag">${escHtml(s)}</span>`
    ).join('');
}

function renderCvOutput(cv) {
    const box = document.getElementById('output-box');
    if (box) box.textContent = cvObjToTS(cv, 'all');
}

/* ─────────────────────────────────────────────
   Reset CV
───────────────────────────────────────────── */
function resetCvForm() {
    if (!confirm('Reset all CV fields?')) return;
    ['cv-name','cv-role','cv-location','cv-email','cv-website','cv-skills'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const profile = document.getElementById('cv-profile');
    if (profile) { profile.value = ''; autoGrow(profile); }
    cvExperience = []; cvEducation = []; cvAwards = [];
    renderCvExperience(); renderCvEducation(); renderCvAwards();
    cvLiveUpdate();
}

/* ─────────────────────────────────────────────
   Override switchRight to support CV output
───────────────────────────────────────────── */
const _origSwitchRight = typeof switchRight === 'function' ? switchRight : null;
switchRight = function(tab, el) {
    rightTab = tab;
    document.getElementById('rp-preview').style.display = tab === 'preview' ? 'block' : 'none';
    document.getElementById('rp-output').style.display  = tab === 'output'  ? 'block' : 'none';
    document.querySelectorAll('.right-tab').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    if (tab === 'output') {
        if (currentAppTab === 'cv') renderCvOutput(buildCvObj());
        else renderOutput();
    } else {
        if (currentAppTab === 'cv') renderCvPreview(buildCvObj());
        else renderPreview();
    }
};

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
applyPanelState();
renderCvExperience();
renderCvEducation();
renderCvAwards();
cvLiveUpdate();
