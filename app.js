/* ── Constants ── */
const ICONS = ["github", "figma", "prototype", "live", "document", "video", "link", "eye", "play"];
const ICON_MAP = {
    github: "GitHub", figma: "Figma", prototype: "Prototype", live: "Live Site",
    document: "Docs", video: "Video", link: "Link", eye: "Preview", play: "Play"
};

/* ── State ── */
let tags = [], links = [], authors = [], rightTab = 'preview';

/* ── Helpers ── */
function g(id) { return document.getElementById(id); }
function val(id) { return g(id).value.trim(); }

function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escStr(s) {
    return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/* ── Navigation ── */
function scrollToSection(id) {
    g(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchRight(tab, el) {
    rightTab = tab;
    g('rp-preview').style.display = tab === 'preview' ? 'block' : 'none';
    g('rp-output').style.display = tab === 'output' ? 'block' : 'none';
    document.querySelectorAll('.right-tab').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    if (tab === 'output') renderOutput();
    else renderPreview();
}

function liveUpdate() {
    if (rightTab === 'preview') renderPreview();
    else renderOutput();
}

/* ── Description ── */
function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function getDesc() {
    return (g('f-desc').value || '').trim();
}

/* ── Tags ── */
function tagKey(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
        e.preventDefault();
        addTag();
    }
}

function addTag() {
    const inp = g('f-tag-input'), v = inp.value.trim();
    if (v && !tags.includes(v)) {
        tags.push(v);
        inp.value = '';
        renderTags();
        liveUpdate();
    }
}

function removeTag(i) { tags.splice(i, 1); renderTags(); liveUpdate(); }

function renderTags() {
    g('tags-list').innerHTML = tags.map((t, i) =>
        `<span class="tag">${escHtml(t)}<button class="tag-rm" onclick="removeTag(${i})" aria-label="remove">×</button></span>`
    ).join('');
}

/* ── Links ── */
function syncLinks() {
    document.querySelectorAll('#links-list .link-row').forEach((row, i) => {
        const inputs = row.querySelectorAll('input[type=text]');
        links[i].label = inputs[0].value;
        links[i].url   = inputs[1].value;
        const sel = row.querySelector('select');
        if (sel) links[i].icon = sel.value;
    });
}

function addLink() {
    syncLinks();
    links.push({ icon: 'github', label: '', url: '' });
    renderLinks();
    liveUpdate();
}

function removeLink(i) {
    syncLinks();
    links.splice(i, 1);
    renderLinks();
    liveUpdate();
}

function renderLinks() {
    g('links-list').innerHTML = links.map((l, i) => `
    <div class="link-row">
      <select onchange="links[${i}].icon=this.value;liveUpdate()">
        ${ICONS.map(o => `<option value="${o}"${o === l.icon ? ' selected' : ''}>${ICON_MAP[o]}</option>`).join('')}
      </select>
      <input type="text" placeholder="e.g. View in Figma" value="${escAttr(l.label)}"
        oninput="links[${i}].label=this.value;liveUpdate()">
      <input type="text" placeholder="https://..." value="${escAttr(l.url)}"
        oninput="links[${i}].url=this.value;liveUpdate()">
      <button class="rm-btn" onclick="removeLink(${i})" aria-label="remove">×</button>
    </div>`).join('');
}

/* ── Authors ── */
function syncAuthors() {
    document.querySelectorAll('#authors-list .author-row').forEach((row, i) => {
        const inputs = row.querySelectorAll('input[type=text]');
        authors[i].name      = inputs[0].value;
        authors[i].role      = inputs[1].value;
        authors[i].avatar    = inputs[2].value;
        authors[i].socialUrl = inputs[3].value;
    });
}

function addAuthor() {
    syncAuthors();
    authors.push({ name: '', role: '', avatar: '', socialUrl: '' });
    renderAuthors();
    liveUpdate();
}

function removeAuthor(i) {
    syncAuthors();
    authors.splice(i, 1);
    renderAuthors();
    liveUpdate();
}

function renderAuthors() {
    g('authors-list').innerHTML = authors.map((a, i) => `
    <div class="author-row">
      <input type="text" placeholder="Full name" value="${escAttr(a.name)}"
        oninput="authors[${i}].name=this.value;liveUpdate()">
      <input type="text" placeholder="Designer · Dev" value="${escAttr(a.role)}"
        oninput="authors[${i}].role=this.value;liveUpdate()">
      <div class="drop-wrap avatar-drop-wrap" id="avatar-drop-${i}">
        <input type="text" placeholder="Avatar URL or drop image…" value="${escAttr(a.avatar)}"
          oninput="authors[${i}].avatar=this.value;liveUpdate()">
        <button class="drop-pick-btn" title="Browse image">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
      </div>
      <input type="text" placeholder="https://..." value="${escAttr(a.socialUrl)}"
        oninput="authors[${i}].socialUrl=this.value;liveUpdate()">
      <button class="rm-btn" onclick="removeAuthor(${i})" aria-label="remove">×</button>
    </div>`).join('');

    // Attach drop zones after DOM is updated
    authors.forEach((_, i) => {
        const cell = g(`avatar-drop-${i}`);
        if (cell) initAvatarDrop(cell, i);
    });
}


/* ── Markdown Toolbars (Case Study fields) ── */
function buildToolbar(tbId, taId) {
    const tb = g(tbId), ta = g(taId);
    const btns = [
        { t: 'B',          title: 'Bold (Ctrl+B)',        style: 'font-weight:700', fn: () => wrap(ta, '**', '**') },
        { t: 'I',          title: 'Italic (Ctrl+I)',      style: 'font-style:italic', fn: () => wrap(ta, '*', '*') },
        { t: '~~S~~',      title: 'Strikethrough',        fn: () => wrap(ta, '~~', '~~') },
        { t: '`code`',     title: 'Inline code (Ctrl+`)', fn: () => wrap(ta, '`', '`') },
        'sep',
        { t: 'H1',         title: 'Heading 1',            fn: () => linePrefix(ta, '# ') },
        { t: 'H2',         title: 'Heading 2',            fn: () => linePrefix(ta, '## ') },
        { t: 'H3',         title: 'Heading 3',            fn: () => linePrefix(ta, '### ') },
        'sep',
        { t: '• UL',       title: 'Bullet list',          fn: () => linePrefix(ta, '- ') },
        { t: '1. OL',      title: 'Numbered list',        fn: () => linePrefix(ta, '1. ') },
        { t: '> Quote',    title: 'Blockquote (Ctrl+Q)',  fn: () => linePrefix(ta, '> ') },
        'sep',
        { t: '[Link]',     title: 'Insert link (Ctrl+K)', fn: () => insertMdLink(ta) },
        { t: '![img]',     title: 'Insert image',         fn: () => insertAt(ta, '![Alt text](https://image-url.com)') },
        { t: 'Table',      title: 'Insert table (Ctrl+T)',fn: () => insertTable(ta) },
        { t: '```block```',title: 'Code block',           fn: () => insertCodeBlock(ta) },
        { t: '---',        title: 'Horizontal rule',      fn: () => insertAt(ta, '\n\n---\n\n') },
        'sep',
        { t: '📎 Image', title: 'Browse & upload image', cls: 'md-img-upload-btn', fn: () => {
            if (typeof pickFile === 'function') {
                pickFile(file => {
                    const wrap = ta.closest('.md-wrap');
                    if (typeof handleMdImageUpload === 'function') handleMdImageUpload(file, wrap, ta);
                });
            }
        }},
    ];
    tb.innerHTML = '';
    btns.forEach(b => {
        if (b === 'sep') {
            const s = document.createElement('div'); s.className = 'md-sep'; tb.appendChild(s);
        } else {
            const btn = document.createElement('button');
            btn.className = 'md-btn' + (b.cls ? ' ' + b.cls : '');
            btn.title = b.title; btn.textContent = b.t;
            if (b.style) btn.style.cssText = b.style;
            btn.onmousedown = e => { e.preventDefault(); b.fn(); };
            tb.appendChild(btn);
        }
    });
    ta.addEventListener('keydown', e => mdShortcuts(e, ta));
}

function mdShortcuts(e, ta) {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'b') { e.preventDefault(); wrap(ta, '**', '**'); }
    else if (ctrl && e.key === 'i') { e.preventDefault(); wrap(ta, '*', '*'); }
    else if (ctrl && e.key === 'k') { e.preventDefault(); insertMdLink(ta); }
    else if (ctrl && e.key === '`') { e.preventDefault(); wrap(ta, '`', '`'); }
    else if (ctrl && e.key === 'q') { e.preventDefault(); linePrefix(ta, '> '); }
    else if (ctrl && e.key === 't') { e.preventDefault(); insertTable(ta); }
    else if (e.key === 'Tab') { e.preventDefault(); insertAt(ta, '  '); }
}

function wrap(ta, b, a) {
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e) || 'text';
    const rep = b + sel + a;
    ta.value = v.slice(0, s) + rep + v.slice(e);
    ta.selectionStart = s + b.length; ta.selectionEnd = s + b.length + sel.length;
    ta.focus(); liveUpdate();
}

function linePrefix(ta, p) {
    const s = ta.selectionStart, v = ta.value;
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    ta.value = v.slice(0, ls) + p + v.slice(ls);
    ta.selectionStart = ta.selectionEnd = s + p.length;
    ta.focus(); liveUpdate();
}

function insertAt(ta, txt) {
    const s = ta.selectionStart, v = ta.value;
    ta.value = v.slice(0, s) + txt + v.slice(s);
    ta.selectionStart = ta.selectionEnd = s + txt.length;
    ta.focus(); liveUpdate();
}

function insertMdLink(ta) {
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e) || 'link text';
    const rep = `[${sel}](https://)`;
    ta.value = v.slice(0, s) + rep + v.slice(e);
    ta.selectionStart = s + sel.length + 3;
    ta.selectionEnd = s + rep.length - 1;
    ta.focus(); liveUpdate();
}

function insertTable(ta) {
    insertAt(ta, '\n| Metric | Result |\n|--------|--------|\n| Row 1  | Value  |\n| Row 2  | Value  |\n');
}

function insertCodeBlock(ta) {
    const s = ta.selectionStart, v = ta.value;
    const rep = '```\ncode here\n```';
    ta.value = v.slice(0, s) + rep + v.slice(s);
    ta.selectionStart = s + 4; ta.selectionEnd = s + 13;
    ta.focus(); liveUpdate();
}

/* ── Placeholder URL helpers (inline SVG, transparent bg) ── */
function thumbPlaceholder() {
    const title    = val('f-title')    || 'Project';
    const category = val('f-category') || 'Design';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
  <rect width="800" height="450" fill="none"/>
  <text x="400" y="205" font-family="sans-serif" font-size="42" font-weight="600"
    fill="rgba(140,140,140,0.4)" text-anchor="middle" dominant-baseline="middle">${escXml(title)}</text>
  <text x="400" y="258" font-family="sans-serif" font-size="18" font-weight="400"
    fill="rgba(140,140,140,0.25)" text-anchor="middle" dominant-baseline="middle">${escXml(category)}</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function avatarPlaceholder(name) {
    const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
  <rect width="80" height="80" fill="none"/>
  <text x="40" y="40" font-family="sans-serif" font-size="26" font-weight="600"
    fill="rgba(140,140,140,0.4)" text-anchor="middle" dominant-baseline="middle">${escXml(initials)}</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escXml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* ── Preview ── */
function renderPreview() {
    const thumb = val('f-thumb');
    const img = g('prev-thumb-img'), ph = g('prev-thumb-ph');
    if (thumb) {
        img.src = thumb;
        img.style.display = 'block';
        ph.style.display = 'none';
    } else {
        // Show placeholder image in preview when empty
        img.src = thumbPlaceholder();
        img.style.display = 'block';
        ph.style.display = 'none';
    }

    g('prev-cat').textContent   = val('f-category') || 'Category';
    g('prev-title').textContent = val('f-title') || 'Project title';

    g('prev-desc').textContent = getDesc() || 'Description appears here.';

    g('prev-tags').innerHTML = tags.map(t => `<span class="prev-tag">${escHtml(t)}</span>`).join('');

    g('prev-links').innerHTML = links.length
        ? links.map(l => `<span class="prev-link">${ICON_MAP[l.icon]} · ${escHtml(l.label) || '—'}</span>`).join('')
        : '<span style="font-size:11px;color:var(--text3)">No links</span>';

    g('prev-authors').innerHTML = authors.length
        ? authors.map(a => {
            // Use placeholder avatar when empty
            const avatarSrc = a.avatar || avatarPlaceholder(a.name);
            const av = `<img src="${escAttr(avatarSrc)}" alt="${escAttr(a.name || 'Author')}">`;
            return `<div class="prev-author">
                <div class="prev-avatar">${av}</div>
                <div>
                    <div class="prev-author-name">${escHtml(a.name) || '—'}</div>
                    <div class="prev-author-role">${escHtml(a.role) || '—'}</div>
                </div>
            </div>`;
        }).join('')
        : '<span style="font-size:11px;color:var(--text3)">No authors</span>';
}

/* ── Output ── */
function buildObj() {
    syncLinks();
    syncAuthors();
    // Inject placeholder URLs into the output when fields are empty
    const thumbnail = val('f-thumb') || thumbPlaceholder();
    const authorsWithFallback = authors.map(a => ({
        ...a,
        avatar: a.avatar || avatarPlaceholder(a.name),
    }));
    return {
        title:       val('f-title'),
        category:    val('f-category'),
        description: getDesc(),
        tags:        [...tags],
        thumbnail,
        challenge:   g('f-challenge').value,
        solution:    g('f-solution').value,
        result:      g('f-result').value,
        links:       links.map(l => ({ icon: l.icon, label: l.label, url: l.url })),
        authors:     authorsWithFallback.map(a => ({ name: a.name, role: a.role, avatar: a.avatar, socialUrl: a.socialUrl })),
    };
}

function toTS(o) {
    const tplEsc = s => (s || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const tagsStr = o.tags.map(t => `"${escStr(t)}"`).join(', ');
    const linksStr = o.links.length
        ? '\n' + o.links.map(l =>
            `    { icon: "${escStr(l.icon)}", label: "${escStr(l.label)}", url: "${escStr(l.url)}" },`
        ).join('\n') + '\n  '
        : '';
    const authorsStr = o.authors.length
        ? '\n' + o.authors.map(a =>
            `    { name: "${escStr(a.name)}", role: "${escStr(a.role)}", avatar: "${escStr(a.avatar)}", socialUrl: "${escStr(a.socialUrl)}" },`
        ).join('\n') + '\n  '
        : '';

    return `{
  title: "${escStr(o.title)}",
  category: "${escStr(o.category)}",
  description: \`${tplEsc(o.description)}\`,
  tags: [${tagsStr}],
  thumbnail: "${escStr(o.thumbnail)}",
  challenge: \`
${tplEsc(o.challenge).trim()}
  \`,
  solution: \`
${tplEsc(o.solution).trim()}
  \`,
  result: \`
${tplEsc(o.result).trim()}
  \`,
  links: [${linksStr}],
  authors: [${authorsStr}],
},`;
}

function renderOutput() {
    g('output-box').textContent = toTS(buildObj());
}

function copyOutput() {
    const text = toTS(buildObj());
    navigator.clipboard.writeText(text).then(() => {
        const b = g('copy-badge');
        b.style.display = 'inline-flex';
        setTimeout(() => b.style.display = 'none', 2500);
    });
}

function resetForm() {
    if (!confirm('Reset all fields?')) return;
    ['f-title', 'f-thumb', 'f-challenge', 'f-solution', 'f-result'].forEach(id => g(id).value = '');
    g('f-category').selectedIndex = 0;
    g('f-desc').value = ''; autoGrow(g('f-desc'));
    tags = []; links = []; authors = [];
    renderTags(); renderLinks(); renderAuthors();
    liveUpdate();
}

/* ── Theme ── */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    g('theme-icon').textContent = theme === 'light' ? '🌙' : '☀️';
    g('theme-text').textContent = theme === 'light' ? 'Dark' : 'Light';
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── Init ── */
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);
buildToolbar('tb-challenge', 'f-challenge');
buildToolbar('tb-solution', 'f-solution');
buildToolbar('tb-result', 'f-result');
renderPreview();
// GitHub inits are handled by github-upload.js
/* ── Responsive mobile: toggle via class ── */
(function() {
    function isMobile() { return window.innerWidth <= 900; }
    const origToggle = window.togglePanel;
    window.togglePanel = function(side) {
        if (isMobile()) {
            const layout = document.getElementById('app-layout');
            if (side === 'left') layout.classList.toggle('left-open');
            else layout.classList.toggle('right-open');
        } else {
            if (typeof origToggle === 'function') origToggle(side);
        }
    };
})();
