import { supabase } from './supabaseClient.js';

/* ===== Role colors & config ===== */
const ROLE_COLORS = {
  'Admin':          '#FF4D6D',
  '𝓶𝓸𝓭𝓮𝓻𝓪𝓽𝓸𝓻  🛡️': '#FFA033',
  'ᑌᑎISIOᑎS 🏅':   '#F5C542',
  'Fashionistas':   '#FF6B81',
  'Cinephiles':     '#C084FC',
  'Readers':        '#2DD4BF',
  'Roasters':       '#FF6348',
  'Gamers':         '#4ADE80',
  'Artists':        '#FB923C',
  'Techies':        '#22D3EE',
  'Gym Rats':       '#A3E635',
  'She/Her':        '#F472B6',
  'He/Him':         '#60A5FA',
  'Undergraduate':  '#A78BFA',
  'Free Spirit':    '#FBBF24',
  'Chat Revival':   '#34D399',
  'Ask':            '#FB7185',
  'RGB 2':          '#EF4444',
  'RGB 3':          '#22C55E',
  'RGB 4':          '#3B82F6',
  'RGB 5':          '#A855F7',
  'Lemon':          '#FACC15',
  'Kiwi':           '#84CC16',
  'Blueberry':      '#818CF8',
  'Grapes':         '#9333EA',
  'BOT':            '#6B7280',
};

const HIDDEN_ROLES = new Set(['Members', 'ᑌᑎISIOᑎS 🏅']);
const PRONOUN_ROLES = new Set(['He/Him', 'She/Her', 'They/Them']);

const GRADS = [
  'linear-gradient(135deg,#FF6B4A,#FF2D68)',
  'linear-gradient(135deg,#F5C542,#FF9500)',
  'linear-gradient(135deg,#2DD4BF,#06B6D4)',
  'linear-gradient(135deg,#A78BFA,#7C3AED)',
  'linear-gradient(135deg,#F472B6,#EC4899)',
  'linear-gradient(135deg,#4ADE80,#16A34A)',
  'linear-gradient(135deg,#FB923C,#EA580C)',
  'linear-gradient(135deg,#38BDF8,#3B82F6)',
];

/* ===== State ===== */
let DATA = { serverName: '', members: [], exportedAt: null };
let filter = 'all';
let query = '';
let botsOn = true;
let view = 'grid';
let adminQuery = '';

/* ===== Utils ===== */
function isZalgo(s) {
  return /[\u0300-\u036F\u0483-\u0489\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/u.test(s || '');
}
function relTime(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const day = Math.floor(h / 24);
  if (day < 30) return day + 'd ago';
  const mo = Math.floor(day / 30);
  if (mo < 12) return mo + 'mo ago';
  return Math.floor(mo / 12) + 'y ago';
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
function roleColor(r) { return ROLE_COLORS[r] || '#6B7280'; }
function isColored(r) { return r in ROLE_COLORS; }
function memberAccent(roles) {
  for (const r of roles) {
    if (ROLE_COLORS[r] && !HIDDEN_ROLES.has(r) && r !== 'BOT') return ROLE_COLORS[r];
  }
  return 'var(--border-light)';
}
function visibleRoles(roles) {
  return (roles || []).filter(r => !HIDDEN_ROLES.has(r) && !isZalgo(r));
}
function avatarGrad(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADS[Math.abs(h) % GRADS.length];
}
function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

/* ===== Stats ===== */
function computeStats(members) {
  const humans = members.filter(m => !m.bot);
  const allR = new Set();
  members.forEach(m => (m.roles || []).forEach(r => allR.add(r)));

  const rc = {};
  members.forEach(m => (m.roles || []).forEach(r => {
    if (!HIDDEN_ROLES.has(r) && !isZalgo(r)) rc[r] = (rc[r] || 0) + 1;
  }));
  const vibeR = {};
  members.forEach(m => (m.roles || []).forEach(r => {
    if (!HIDDEN_ROLES.has(r) && !isZalgo(r) && !PRONOUN_ROLES.has(r) && r !== 'BOT')
      vibeR[r] = (vibeR[r] || 0) + 1;
  }));

  return {
    total: members.length,
    humans: humans.length,
    bots: members.length - humans.length,
    roles: allR.size,
    admins: humans.filter(m => (m.roles || []).includes('Admin')).length,
    mods: humans.filter(m => (m.roles || []).includes('𝓶𝓸𝓭𝓮𝓻𝓪𝓽𝓸𝓻  🛡️')).length,
    rc, vibeR,
  };
}

function vibeDesc(vibeR) {
  const sorted = Object.entries(vibeR).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return 'A growing community finding its identity.';
  const vm = {
    'Gamers':'gaming sessions','Techies':'tech deep-dives','Cinephiles':'movie nights',
    'Readers':'book discussions','Artists':'creative showcases','Fashionistas':'style inspo',
    'Gym Rats':'fitness check-ins','Roasters':'roasting battles',
  };
  const [t1, t2, t3] = sorted.slice(0, 3).map(e => e[0]);
  const d1 = vm[t1] || `${t1.toLowerCase()} talk`;
  const d2 = vm[t2] || `${t2.toLowerCase()} discussions`;
  let txt = `This community runs on <strong>${esc(t1)}</strong> and <strong>${esc(t2)}</strong> — expect plenty of ${d1} and ${d2}.`;
  if (t3) txt += ` Throw in some <strong>${esc(t3)}</strong> energy and you've got a vibe that's hard to replicate.`;
  return txt;
}

/* ===== Render: stats ===== */
function renderStats(s) {
  const items = [
    { icon:'fa-users',         bg:'var(--accent-soft)', ic:'var(--accent)',  v:s.total,  l:'Total',   a:'var(--accent)' },
    { icon:'fa-user',          bg:'var(--green-soft)',  ic:'var(--green)',   v:s.humans, l:'Humans',  a:'var(--green)' },
    { icon:'fa-robot',         bg:'rgba(156,163,175,0.1)', ic:'#B8C0D0',    v:s.bots,   l:'Bots',    a:'#9CA3AF' },
    { icon:'fa-tags',          bg:'var(--gold-soft)',   ic:'var(--gold)',    v:s.roles,  l:'Roles',   a:'var(--gold)' },
    { icon:'fa-shield-halved', bg:'var(--rose-soft)',   ic:'var(--rose)',    v:s.admins, l:'Admins',  a:'var(--rose)' },
    { icon:'fa-gavel',         bg:'var(--sky-soft)',    ic:'var(--sky)',     v:s.mods,   l:'Mods',    a:'var(--sky)' },
  ];
  const g = document.getElementById('stats-grid');
  g.innerHTML = items.map((c, i) => `
    <div class="stat-card" style="--stat-accent:${c.a};animation-delay:${i * 60}ms">
      <div class="stat-top">
        <div class="stat-icon" style="background:${c.bg};color:${c.ic}"><i class="fa-solid ${c.icon}"></i></div>
        <div class="stat-label">${c.l}</div>
      </div>
      <div class="stat-value" data-to="${c.v}">0</div>
    </div>
  `).join('');
  g.querySelectorAll('.stat-value').forEach(el => {
    const t = +el.dataset.to, start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / 1100, 1);
      el.textContent = Math.round(t * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  });
}

/* ===== Render: vibes ===== */
function renderVibes(s) {
  document.getElementById('vibe-text').innerHTML = vibeDesc(s.vibeR);
  const bars = document.getElementById('bars');
  const sorted = Object.entries(s.rc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!sorted.length) { bars.innerHTML = ''; return; }
  const mx = sorted[0][1] || 1;
  bars.innerHTML = sorted.map(([r, n], i) => {
    const c = roleColor(r), pct = (n / mx * 100).toFixed(1);
    return `<div class="bar-row">
      <div class="bar-label" title="${esc(r)}">${esc(r)}</div>
      <div class="bar-track"><div class="bar-fill" data-w="${pct}" style="background:${c};transition-delay:${i * 60}ms"></div></div>
      <div class="bar-num">${n}</div>
    </div>`;
  }).join('');
  requestAnimationFrame(() => bars.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'));
}

/* ===== Render: chips ===== */
function renderChips(s) {
  const box = document.getElementById('chips');
  const sorted = Object.entries(s.rc).sort((a, b) => b[1] - a[1]).slice(0, 15);
  let h = `<button class="chip active" data-r="all" style="--chip-bg:var(--accent);--chip-shadow:var(--accent-glow)">All <span class="chip-n">${s.total}</span></button>`;
  sorted.forEach(([r, n]) => {
    const c = roleColor(r);
    h += `<button class="chip" data-r="${esc(r)}" style="--chip-bg:${c};--chip-shadow:${c}33">${esc(r)} <span class="chip-n">${n}</span></button>`;
  });
  box.innerHTML = h;
  box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
    box.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    ch.classList.add('active');
    filter = ch.dataset.r;
    renderMembers();
  }));
}

/* ===== Filter & render members ===== */
function filtered() {
  let m = DATA.members;
  if (!botsOn) m = m.filter(x => !x.bot);
  if (filter !== 'all') m = m.filter(x => (x.roles || []).includes(filter));
  if (query) {
    const q = query.toLowerCase();
    m = m.filter(x =>
      (x.display_name || '').toLowerCase().includes(q) ||
      (x.username || '').toLowerCase().includes(q)
    );
  }
  return [...m].sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at));
}

function renderMembers() {
  const grid = document.getElementById('members-grid');
  const list = filtered();
  document.getElementById('rcount').textContent = list.length + ' member' + (list.length !== 1 ? 's' : '');
  if (!list.length) {
    grid.innerHTML = '<div class="empty-block"><i class="fa-solid fa-ghost"></i><p>No members match your filters</p></div>';
    return;
  }
  grid.innerHTML = list.map((m, i) => {
    const accent = memberAccent(m.roles || []);
    const vr = visibleRoles(m.roles).slice(0, view === 'list' ? 8 : 4);
    const rolesH = vr.map(r => `<span class="mc-role ${isColored(r) ? 'color' : ''}" style="${isColored(r) ? 'background:' + roleColor(r) : ''}">${esc(r)}</span>`).join('');
    const init = initials(m.display_name || m.username);
    const grad = avatarGrad(m.display_name || m.username);
    const avH = m.avatar
      ? `<img class="mc-avatar" src="${esc(m.avatar)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'mc-avatar-fb\\' style=\\'background:${grad}\\'>${init}</div>'">`
      : `<div class="mc-avatar-fb" style="background:${grad}">${init}</div>`;
    return `<div class="member-card" data-id="${esc(m.id)}" style="--card-color:${accent};animation-delay:${Math.min(i * 25, 500)}ms">
      <div class="mc-head">
        ${avH}
        <div class="mc-info">
          <div class="mc-name">${esc(m.display_name)}</div>
          <div class="mc-user">@${esc(m.username)}</div>
        </div>
        ${m.bot ? '<span class="mc-bot-tag"><i class="fa-solid fa-robot"></i> BOT</span>' : ''}
      </div>
      <div class="mc-roles">${rolesH}</div>
      <div class="mc-foot"><i class="fa-regular fa-clock"></i> ${relTime(m.joined_at)}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.member-card').forEach(c => c.addEventListener('click', () => {
    const m = DATA.members.find(x => x.id === c.dataset.id);
    if (m) openModal(m);
  }));
}

/* ===== Modal ===== */
function openModal(m) {
  const ov = document.getElementById('modal-bg');
  const box = document.getElementById('modal-box');
  const accent = memberAccent(m.roles || []);
  const init = initials(m.display_name || m.username);
  const grad = avatarGrad(m.display_name || m.username);
  const avH = m.avatar
    ? `<img class="modal-pfp" src="${esc(m.avatar)}" alt="" onerror="this.outerHTML='<div class=\\'modal-pfp-fb\\' style=\\'background:${grad}\\'>${init}</div>'">`
    : `<div class="modal-pfp-fb" style="background:${grad}">${init}</div>`;
  const vr = visibleRoles(m.roles);
  const rolesH = vr.map(r => `<span class="mc-role ${isColored(r) ? 'color' : ''}" style="${isColored(r) ? 'background:' + roleColor(r) : ''}">${esc(r)}</span>`).join('');
  box.innerHTML = `
    <div class="modal-banner" style="background:linear-gradient(135deg,${accent},var(--accent),var(--gold))">
      <button class="modal-x" id="mx" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    ${avH}
    <div class="modal-body">
      <div class="modal-name">${esc(m.display_name)}</div>
      <div class="modal-user">@${esc(m.username)}</div>
      <div class="modal-row">
        <span class="modal-row-label">ID</span>
        <span class="modal-row-val mono">${esc(m.id)}</span>
        <button class="copy-btn" data-c="${esc(m.id)}"><i class="fa-regular fa-copy"></i></button>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Joined</span>
        <span class="modal-row-val">${fmtDate(m.joined_at)} (${relTime(m.joined_at)})</span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Type</span>
        <span class="modal-row-val">${m.bot ? '<i class="fa-solid fa-robot"></i> Bot' : '<i class="fa-solid fa-user"></i> Human'}</span>
      </div>
      <div class="modal-row" style="flex-direction:column;align-items:flex-start;gap:8px">
        <span class="modal-row-label">Roles (${(m.roles || []).length})</span>
        <div class="modal-roles-wrap">${rolesH}</div>
      </div>
    </div>`;
  ov.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('mx').addEventListener('click', closeModal);
  box.querySelectorAll('.copy-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const text = b.dataset.c;
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard')).catch(() => {
      const t = document.createElement('textarea'); t.value = text;
      document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
      toast('Copied to clipboard');
    });
  }));
}
function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  document.body.style.overflow = '';
}

/* ===== Toast ===== */
function toast(msg, kind = '') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast' + (kind ? ' ' + kind : '');
  t.innerHTML = `<i class="fa-solid ${kind === 'err' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${esc(msg)}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

/* ===== Spotlight ===== */
function spotlight() {
  const humans = DATA.members.filter(m => !m.bot);
  if (!humans.length) return;
  document.querySelectorAll('.member-card.spotlight').forEach(c => c.classList.remove('spotlight'));
  const pick = humans[Math.floor(Math.random() * humans.length)];
  const card = document.querySelector(`.member-card[data-id="${CSS.escape(pick.id)}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('spotlight');
    toast(`Spotlight: ${pick.display_name}`);
    setTimeout(() => card.classList.remove('spotlight'), 5000);
  } else {
    toast(`Spotlight: ${pick.display_name} (not in current view)`);
  }
}

/* ===== Admin drawer ===== */
function openDrawer() {
  document.getElementById('admin-drawer').classList.add('open');
  document.getElementById('drawer-bg').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderAdminList();
}
function closeDrawer() {
  document.getElementById('admin-drawer').classList.remove('open');
  document.getElementById('drawer-bg').classList.remove('open');
  document.body.style.overflow = '';
}
function renderAdminList() {
  const box = document.getElementById('admin-list');
  let list = [...DATA.members];
  if (adminQuery) {
    const q = adminQuery.toLowerCase();
    list = list.filter(m =>
      (m.display_name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
  if (!list.length) {
    box.innerHTML = '<div style="color:var(--text-mute);padding:20px;text-align:center;font-size:0.85rem">No members found</div>';
    return;
  }
  box.innerHTML = list.map(m => {
    const init = initials(m.display_name || m.username);
    const grad = avatarGrad(m.display_name || m.username);
    const avH = m.avatar
      ? `<img src="${esc(m.avatar)}" alt="" onerror="this.outerHTML='<div class=\\'ai-fb\\' style=\\'background:${grad}\\'>${init}</div>'">`
      : `<div class="ai-fb" style="background:${grad}">${init}</div>`;
    return `<div class="admin-item" data-id="${esc(m.id)}">
      ${avH}
      <div class="ai-meta">
        <div class="ai-name">${esc(m.display_name)}</div>
        <div class="ai-sub">@${esc(m.username)}${m.bot ? ' · Bot' : ''}</div>
      </div>
      <div class="ai-actions">
        <button class="ai-btn" data-act="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="ai-btn danger" data-act="del" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
  box.querySelectorAll('.admin-item').forEach(item => {
    item.querySelector('[data-act="edit"]').addEventListener('click', () => {
      const m = DATA.members.find(x => x.id === item.dataset.id);
      if (m) openForm(m);
    });
    item.querySelector('[data-act="del"]').addEventListener('click', async () => {
      const m = DATA.members.find(x => x.id === item.dataset.id);
      if (!m) return;
      if (!confirm(`Delete "${m.display_name}"? This cannot be undone.`)) return;
      const { error } = await supabase.from('members').delete().eq('id', m.id);
      if (error) { toast('Delete failed: ' + error.message, 'err'); return; }
      await refreshData();
      toast('Member deleted');
    });
  });
}

/* ===== Add/Edit form ===== */
function openForm(member = null) {
  const isEdit = !!member;
  const m = member || { id: '', username: '', display_name: '', avatar: '', bot: false, joined_at: new Date().toISOString(), roles: [] };
  const fm = document.getElementById('form-modal');
  fm.innerHTML = `
    <div class="fm-head">
      <h3>${isEdit ? 'Edit member' : 'Add new member'}</h3>
      <button class="drawer-close" id="fm-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="fm-body">
      ${!isEdit ? `<div class="fm-row">
        <label>Discord ID</label>
        <input id="f-id" placeholder="e.g. 1506326627787739257" value="${esc(m.id)}">
        <div class="hint">Unique numeric id. Leave blank to auto-generate one.</div>
      </div>` : ''}
      <div class="fm-row">
        <label>Display name *</label>
        <input id="f-name" placeholder="Shown on the card" value="${esc(m.display_name)}">
      </div>
      <div class="fm-row">
        <label>Username *</label>
        <input id="f-user" placeholder="@handle" value="${esc(m.username)}">
      </div>
      <div class="fm-row">
        <label>Avatar URL</label>
        <input id="f-avatar" placeholder="https://cdn.discordapp.com/…" value="${esc(m.avatar || '')}">
        <div class="hint">Optional. Falls back to a colored gradient if blank or broken.</div>
      </div>
      <div class="fm-grid2">
        <div class="fm-row">
          <label>Joined date</label>
          <input id="f-joined" type="date" value="${(m.joined_at || new Date().toISOString()).slice(0, 10)}">
        </div>
        <div class="fm-row" style="justify-content:flex-end">
          <label>&nbsp;</label>
          <label class="fm-check"><input id="f-bot" type="checkbox" ${m.bot ? 'checked' : ''}><span>Bot account</span></label>
        </div>
      </div>
      <div class="fm-row">
        <label>Roles</label>
        <textarea id="f-roles" placeholder="Comma-separated, e.g. Gamers, Techies, He/Him">${esc((m.roles || []).join(', '))}</textarea>
        <div class="hint">Separate roles with commas. Known roles get colored badges automatically.</div>
      </div>
      <div class="fm-actions">
        ${isEdit ? '<button class="fm-btn danger" id="f-del"><i class="fa-solid fa-trash"></i> Delete</button>' : ''}
        <button class="fm-btn" id="f-cancel">Cancel</button>
        <button class="fm-btn primary" id="f-save">${isEdit ? 'Save changes' : 'Add member'}</button>
      </div>
    </div>`;
  document.getElementById('form-modal-bg').classList.add('open');

  const close = () => document.getElementById('form-modal-bg').classList.remove('open');
  document.getElementById('fm-close').addEventListener('click', close);
  document.getElementById('f-cancel').addEventListener('click', close);

  if (isEdit) {
    document.getElementById('f-del').addEventListener('click', async () => {
      if (!confirm(`Delete "${m.display_name}"? This cannot be undone.`)) return;
      const { error } = await supabase.from('members').delete().eq('id', m.id);
      if (error) { toast('Delete failed: ' + error.message, 'err'); return; }
      close();
      await refreshData();
      toast('Member deleted');
    });
  }

  document.getElementById('f-save').addEventListener('click', async () => {
    const name = document.getElementById('f-name').value.trim();
    const user = document.getElementById('f-user').value.trim();
    if (!name || !user) { toast('Name and username are required', 'err'); return; }

    const roles = document.getElementById('f-roles').value
      .split(',').map(r => r.trim()).filter(Boolean);
    const joinedInput = document.getElementById('f-joined').value;
    const joinedAt = joinedInput ? new Date(joinedInput + 'T00:00:00Z').toISOString() : new Date().toISOString();
    const avatarVal = document.getElementById('f-avatar').value.trim() || null;
    const bot = document.getElementById('f-bot').checked;

    const payload = {
      username: user,
      display_name: name,
      avatar: avatarVal,
      bot,
      joined_at: joinedAt,
      roles,
    };

    if (isEdit) {
      const { error } = await supabase.from('members').update(payload).eq('id', m.id);
      if (error) { toast('Update failed: ' + error.message, 'err'); return; }
      toast('Member updated');
    } else {
      let id = document.getElementById('f-id').value.trim();
      if (!id) {
        // Generate a plausible snowflake-ish string id
        id = (BigInt(Date.now()) << 22n | BigInt(Math.floor(Math.random() * 4194304))).toString();
      }
      payload.id = id;
      const { error } = await supabase.from('members').insert(payload);
      if (error) { toast('Add failed: ' + error.message, 'err'); return; }
      toast('Member added');
    }
    close();
    await refreshData();
  });
}

/* ===== Data refresh from Supabase ===== */
async function refreshData() {
  const [{ data: server }, { data: members }] = await Promise.all([
    supabase.from('server_info').select('*').eq('id', 1).maybeSingle(),
    supabase.from('members').select('*'),
  ]);
  if (server) {
    DATA.serverName = server.server_name;
    DATA.exportedAt = server.exported_at;
  }
  DATA.members = (members || []).map(m => ({
    id: m.id,
    username: m.username,
    display_name: m.display_name,
    avatar: m.avatar,
    bot: m.bot,
    joined_at: m.joined_at,
    roles: m.roles || [],
  }));
  const s = computeStats(DATA.members);
  renderStats(s);
  renderVibes(s);
  renderChips(s);
  renderMembers();
  renderAdminList();
  document.getElementById('nav-name').textContent = DATA.serverName;
  const hm = DATA.members.filter(m => !m.bot).length;
  const bt = DATA.members.length - hm;
  document.getElementById('hero-meta').innerHTML =
    `<span>${DATA.members.length}</span> members <span class="dot"></span> <span>${hm}</span> humans <span class="dot"></span> <span>${bt}</span> bots`;
  document.getElementById('hero-date').textContent = 'Last updated ' + fmtDate(DATA.exportedAt || new Date());
  document.getElementById('hero-title').textContent = DATA.serverName || 'Community';
}

/* ===== Init ===== */
async function init() {
  const loadEl = document.getElementById('load');
  try {
    await refreshData();
  } catch (e) {
    loadEl.innerHTML = `<div class="err-screen"><i class="fa-solid fa-triangle-exclamation"></i><p>Failed to load community data</p><p style="margin-top:6px">${esc(e.message || 'Unknown error')}</p></div>`;
    return;
  }
  loadEl.style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Search
  const inp = document.getElementById('search');
  let t;
  inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { query = inp.value.trim(); renderMembers(); }, 180); });

  // Bot toggle
  document.getElementById('bot-btn').addEventListener('click', function () {
    botsOn = !botsOn;
    this.innerHTML = botsOn
      ? '<i class="fa-solid fa-robot"></i> <span class="hide-sm">Bots On</span>'
      : '<i class="fa-solid fa-robot"></i> <span class="hide-sm">Bots Off</span>';
    this.classList.toggle('active', botsOn);
    this.setAttribute('aria-pressed', botsOn);
    renderMembers();
  });

  // View toggle
  document.getElementById('view-btn').addEventListener('click', function () {
    view = view === 'grid' ? 'list' : 'grid';
    document.getElementById('members-grid').classList.toggle('list-view', view === 'list');
    this.innerHTML = view === 'grid' ? '<i class="fa-solid fa-list"></i>' : '<i class="fa-solid fa-grip"></i>';
    this.title = view === 'grid' ? 'Switch to list view' : 'Switch to grid view';
    renderMembers();
  });

  // Random
  document.getElementById('rand-btn').addEventListener('click', spotlight);

  // Admin drawer
  document.getElementById('admin-btn').addEventListener('click', openDrawer);
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  document.getElementById('drawer-bg').addEventListener('click', closeDrawer);
  document.getElementById('add-member-btn').addEventListener('click', () => openForm(null));
  const aSearch = document.getElementById('admin-search');
  let at;
  aSearch.addEventListener('input', () => { clearTimeout(at); at = setTimeout(() => { adminQuery = aSearch.value.trim(); renderAdminList(); }, 160); });

  // Modal outside click
  document.getElementById('modal-bg').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('form-modal-bg').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('form-modal-bg').classList.remove('open');
      closeDrawer();
    }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); inp.focus();
    }
    if (e.key.toLowerCase() === 'r' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'
        && !document.getElementById('modal-bg').classList.contains('open') && !document.getElementById('admin-drawer').classList.contains('open')) {
      spotlight();
    }
    if (e.key.toLowerCase() === 'm' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      const open = document.getElementById('admin-drawer').classList.contains('open');
      open ? closeDrawer() : openDrawer();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
