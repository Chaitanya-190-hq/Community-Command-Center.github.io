/* ===== 角色颜色映射 ===== */
const ROLE_COLORS = {
  'Admin':          '#FF4757',
  '𝓶𝓸𝓭𝓮𝓻𝓪𝓽𝓸𝓻  🛡️': '#FFA502',
  'ᑌᑎISIOᑎS 🏅':   '#FFD700',
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
  'Lemon':          '#FDE047',
  'Kiwi':           '#84CC16',
  'Blueberry':      '#818CF8',
  'Grapes':         '#9333EA',
  'BOT':            '#6B7280',
};

/* 需要从筛选和徽章中隐藏的通用/乱码角色 */
const HIDDEN_ROLES = new Set([
  'Members',
  'ᑌᑎISIOᑎS 🏅',
]);

/* 乱码 bot 角色检测（含 Zalgo 字符） */
function isZalgoRole(role) {
  const zalgoRange = /[\u0300-\u036F\u0483-\u0489\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F\u{1AB0}-\u{1AFF}\u{1DC0}-\u{1DFF}]/u;
  return zalgoRange.test(role);
}

/* ===== 状态变量 ===== */
let DATA = null;
let currentFilter = 'all';
let searchQuery = '';
let showBots = true;
let viewMode = 'grid'; // 'grid' | 'list'

/* ===== 工具函数 ===== */

/* 相对时间 */
function relativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/* 格式化日期 */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

/* 获取角色颜色 */
function getRoleColor(role) {
  return ROLE_COLORS[role] || '#6B7280';
}

/* 判断角色是否应该显示为彩色徽章 */
function isColoredRole(role) {
  return ROLE_COLORS.hasOwnProperty(role);
}

/* 获取成员的"主色"（第一个有颜色的角色） */
function getMemberAccent(roles) {
  for (const r of roles) {
    if (ROLE_COLORS[r] && r !== 'BOT' && r !== 'Members' && r !== 'ᑌᑎISIOᑎS 🏅') {
      return ROLE_COLORS[r];
    }
  }
  return 'var(--border)';
}

/* 获取头像背景渐变（用于 fallback） */
function getAvatarGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #FF5E3A, #FF2D55)',
    'linear-gradient(135deg, #FFB84D, #FF9500)',
    'linear-gradient(135deg, #2DD4BF, #06B6D4)',
    'linear-gradient(135deg, #A78BFA, #7C3AED)',
    'linear-gradient(135deg, #F472B6, #EC4899)',
    'linear-gradient(135deg, #4ADE80, #16A34A)',
    'linear-gradient(135deg, #FB923C, #EA580C)',
    'linear-gradient(135deg, #60A5FA, #3B82F6)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

/* 过滤出可见的角色 */
function getVisibleRoles(roles) {
  return roles.filter(r => !HIDDEN_ROLES.has(r) && !isZalgoRole(r));
}

/* ===== 统计计算 ===== */
function computeStats(members) {
  const humans = members.filter(m => !m.bot);
  const bots = members.filter(m => m.bot);
  const allRoles = new Set();
  members.forEach(m => m.roles.forEach(r => allRoles.add(r)));

  /* 计算非通用角色分布 */
  const roleCounts = {};
  members.forEach(m => {
    m.roles.forEach(r => {
      if (!HIDDEN_ROLES.has(r) && !isZalgoRole(r)) {
        roleCounts[r] = (roleCounts[r] || 0) + 1;
      }
    });
  });

  const admins = humans.filter(m => m.roles.includes('Admin'));
  const mods = humans.filter(m => m.roles.includes('𝓶𝓸𝓭𝓮𝓻𝓪𝓽𝓸𝓻  🛡️'));

  return {
    total: members.length,
    humans: humans.length,
    bots: bots.length,
    uniqueRoles: allRoles.size,
    admins: admins.length,
    mods: mods.length,
    roleCounts,
    admins_list: admins,
    mods_list: mods,
  };
}

/* 生成氛围描述 */
function generateVibeDesc(roleCounts) {
  const sorted = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3).map(e => e[0]);
  if (top.length < 2) return 'A growing community finding its identity.';

  const vibeMap = {
    'Gamers': 'gaming sessions',
    'Techies': 'tech deep-dives',
    'Cinephiles': 'movie nights',
    'Readers': 'book discussions',
    'Artists': 'creative showcases',
    'Fashionistas': 'style inspo drops',
    'Gym Rats': 'fitness check-ins',
    'Roasters': 'heated roasting battles',
  };

  const d1 = vibeMap[top[0]] || `${top[0]} talks`;
  const d2 = vibeMap[top[1]] || `${top[1]} discussions`;

  return `This community runs on <strong>${top[0]}</strong> and <strong>${top[1]}</strong> — expect plenty of ${d1} and ${d2}. ${top[2] ? `Throw in some <strong>${top[2]}</strong> energy and you\'ve got a vibe that\'s hard to replicate.` : ''}`;
}

/* ===== 渲染函数 ===== */

/* 渲染统计卡片 */
function renderStats(stats) {
  const cards = [
    { icon: 'fa-users', bg: 'rgba(255,94,58,0.12)', color: '#FF5E3A', value: stats.total, label: 'Total Members' },
    { icon: 'fa-user', bg: 'rgba(74,222,128,0.12)', color: '#4ADE80', value: stats.humans, label: 'Humans' },
    { icon: 'fa-robot', bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', value: stats.bots, label: 'Bots' },
    { icon: 'fa-tags', bg: 'rgba(255,184,77,0.12)', color: '#FFB84D', value: stats.uniqueRoles, label: 'Unique Roles' },
    { icon: 'fa-shield-halved', bg: 'rgba(255,71,87,0.12)', color: '#FF4757', value: stats.admins, label: 'Admins' },
    { icon: 'fa-gavel', bg: 'rgba(255,165,2,0.12)', color: '#FFA502', value: stats.mods, label: 'Moderators' },
  ];

  const grid = document.getElementById('stats-grid');
  grid.innerHTML = cards.map((c, i) => `
    <div class="stat-card" style="animation-delay:${i * 60}ms">
      <div class="stat-icon" style="background:${c.bg};color:${c.color}">
        <i class="fa-solid ${c.icon}"></i>
      </div>
      <div class="stat-number" data-target="${c.value}">0</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');

  /* 数字递增动画 */
  grid.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.target);
    animateNumber(el, target, 1200);
  });
}

/* 数字递增动画 */
function animateNumber(el, target, duration) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(target * ease);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* 渲染氛围图 */
function renderVibes(stats) {
  const desc = document.getElementById('vibe-desc');
  desc.innerHTML = generateVibeDesc(stats.roleCounts);

  const bars = document.getElementById('chart-bars');
  const sorted = Object.entries(stats.roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const max = sorted[0]?.[1] || 1;
  bars.innerHTML = sorted.map(([role, count], i) => {
    const color = getRoleColor(role);
    const pct = (count / max * 100).toFixed(1);
    return `
      <div class="chart-row">
        <div class="chart-label" title="${role}">${role}</div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" data-width="${pct}" style="background:${color};animation-delay:${i * 80}ms">${count > 3 ? count : ''}</div>
        </div>
        <div class="chart-count">${count}</div>
      </div>
    `;
  }).join('');

  /* 触发条形图动画 */
  requestAnimationFrame(() => {
    bars.querySelectorAll('.chart-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  });
}

/* 渲染筛选标签 */
function renderFilters(stats) {
  const container = document.getElementById('filter-chips');
  const sorted = Object.entries(stats.roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  let html = `<button class="chip active" data-role="all" style="--chip-color:var(--accent)">All <span class="chip-count">${stats.total}</span></button>`;

  sorted.forEach(([role, count]) => {
    const color = getRoleColor(role);
    html += `<button class="chip" data-role="${role}" style="--chip-color:${color}">${role} <span class="chip-count">${count}</span></button>`;
  });

  container.innerHTML = html;

  /* 绑定点击事件 */
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.role;
      renderMembers();
    });
  });
}

/* 获取过滤后的成员列表 */
function getFilteredMembers() {
  let members = DATA.members;

  /* Bot 筛选 */
  if (!showBots) members = members.filter(m => !m.bot);

  /* 角色筛选 */
  if (currentFilter !== 'all') {
    members = members.filter(m => m.roles.includes(currentFilter));
  }

  /* 搜索筛选 */
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    members = members.filter(m =>
      m.displayName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q)
    );
  }

  /* 按加入时间排序（最新在前） */
  members.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

  return members;
}

/* 渲染成员卡片 */
function renderMembers() {
  const grid = document.getElementById('members-grid');
  const filtered = getFilteredMembers();
  const info = document.getElementById('results-info');
  info.textContent = `${filtered.length} member${filtered.length !== 1 ? 's' : ''} found`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-ghost"></i>
        <p>No members match your filters</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((m, i) => {
    const accent = getMemberAccent(m.roles);
    const visibleRoles = getVisibleRoles(m.roles).slice(0, viewMode === 'list' ? 6 : 3);
    const rolesHTML = visibleRoles.map(r => {
      const colored = isColoredRole(r);
      return `<span class="role-badge ${colored ? 'colored' : ''}" style="${colored ? 'background:' + getRoleColor(r) : ''}">${r}</span>`;
    }).join('');

    const initial = (m.displayName || m.username || '?')[0].toUpperCase();
    const gradient = getAvatarGradient(m.displayName || m.username);
    const avatarHTML = m.avatar
      ? `<img class="card-avatar" src="${m.avatar}" alt="${m.displayName}" loading="lazy" onerror="this.outerHTML='<div class=\\'avatar-fallback\\' style=\\'background:${gradient}\\'>${initial}</div>'">`
      : `<div class="avatar-fallback" style="background:${gradient}">${initial}</div>`;

    return `
      <div class="member-card" data-id="${m.id}" style="--card-accent:${accent};animation-delay:${Math.min(i * 30, 600)}ms">
        ${m.bot ? '<div class="card-bot-badge"><i class="fa-solid fa-robot"></i> BOT</div>' : ''}
        <div class="card-top">
          ${avatarHTML}
          <div class="card-info">
            <div class="card-name">${escapeHTML(m.displayName)}</div>
            <div class="card-username">@${escapeHTML(m.username)}</div>
          </div>
        </div>
        <div class="card-roles">${rolesHTML}</div>
        <div class="card-joined">
          <i class="fa-regular fa-clock"></i> ${relativeTime(m.joinedAt)}
        </div>
      </div>
    `;
  }).join('');

  /* 绑定卡片点击 → 打开模态框 */
  grid.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('click', () => {
      const member = DATA.members.find(m => m.id === card.dataset.id);
      if (member) openModal(member);
    });
  });
}

/* HTML 转义 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ===== 模态框 ===== */
function openModal(member) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-content');
  const accent = getMemberAccent(member.roles);
  const initial = (member.displayName || member.username || '?')[0].toUpperCase();
  const gradient = getAvatarGradient(member.displayName || member.username);

  const avatarHTML = member.avatar
    ? `<img class="modal-avatar" src="${member.avatar}" alt="${member.displayName}" onerror="this.outerHTML='<div class=\\'modal-avatar-fallback\\' style=\\'background:${gradient}\\'>${initial}</div>'">`
    : `<div class="modal-avatar-fallback" style="background:${gradient}">${initial}</div>`;

  const visibleRoles = getVisibleRoles(member.roles);
  const rolesHTML = visibleRoles.map(r => {
    const colored = isColoredRole(r);
    return `<span class="role-badge ${colored ? 'colored' : ''}" style="${colored ? 'background:' + getRoleColor(r) : ''}">${r}</span>`;
  }).join('');

  modal.innerHTML = `
    <button class="modal-close" id="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    ${avatarHTML}
    <div class="modal-name">${escapeHTML(member.displayName)}</div>
    <div class="modal-username">@${escapeHTML(member.username)}</div>
    <div class="modal-detail">
      <span class="modal-detail-label">ID</span>
      <span class="modal-detail-value mono">${member.id}</span>
      <button class="copy-btn" data-copy="${member.id}"><i class="fa-regular fa-copy"></i> Copy</button>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Joined</span>
      <span class="modal-detail-value">${formatDate(member.joinedAt)} (${relativeTime(member.joinedAt)})</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Type</span>
      <span class="modal-detail-value">${member.bot ? '<i class="fa-solid fa-robot"></i> Bot' : '<i class="fa-solid fa-user"></i> Human'}</span>
    </div>
    <div class="modal-detail" style="flex-direction:column;align-items:flex-start;gap:8px">
      <span class="modal-detail-label">Roles (${member.roles.length})</span>
      <div class="modal-roles">${rolesHTML}</div>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  /* 关闭按钮 */
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);

  /* 复制按钮 */
  modal.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(btn.dataset.copy).then(() => {
        showToast('ID copied to clipboard');
      }).catch(() => {
        /* 降级方案 */
        const ta = document.createElement('textarea');
        ta.value = btn.dataset.copy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('ID copied to clipboard');
      });
    });
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ===== Toast 通知 ===== */
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ===== 随机成员高亮 ===== */
function randomSpotlight() {
  const humans = DATA.members.filter(m => !m.bot);
  if (humans.length === 0) return;

  /* 移除之前的高亮 */
  document.querySelectorAll('.member-card.spotlight').forEach(c => c.classList.remove('spotlight'));

  const pick = humans[Math.floor(Math.random() * humans.length)];
  const card = document.querySelector(`.member-card[data-id="${pick.id}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('spotlight');
    showToast(`Spotlight: ${pick.displayName}`);
    setTimeout(() => card.classList.remove('spotlight'), 5000);
  }
}

/* ===== 初始化 ===== */
async function init() {
  const app = document.getElementById('app');
  const loading = document.getElementById('loading-state');

  try {
    const res = await fetch('members.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
  } catch (err) {
    loading.innerHTML = `
      <div class="error-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Failed to load member data</p>
        <p>Make sure <code>members.json</code> is in the same folder as <code>index.html</code></p>
        <p style="margin-top:12px;font-size:0.78rem;opacity:0.6">${escapeHTML(err.message)}</p>
      </div>
    `;
    return;
  }

  /* 隐藏加载，显示内容 */
  loading.style.display = 'none';
  app.style.display = 'block';

  /* 填充服务器名 */
  document.getElementById('server-name').textContent = DATA.serverName;
  document.getElementById('hero-count').innerHTML =
    `<span>${DATA.members.length}</span> members &middot; <span>${DATA.members.filter(m => !m.bot).length}</span> humans &middot; <span>${DATA.members.filter(m => m.bot).length}</span> bots`;
  document.getElementById('export-date').textContent = `Data exported ${formatDate(DATA.exportedAt)}`;

  /* 计算统计 */
  const stats = computeStats(DATA.members);

  /* 渲染各部分 */
  renderStats(stats);
  renderVibes(stats);
  renderFilters(stats);
  renderMembers();

  /* ===== 事件绑定 ===== */

  /* 搜索框 */
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderMembers();
    }, 200);
  });

  /* Bot 切换 */
  document.getElementById('bot-toggle').addEventListener('click', function() {
    showBots = !showBots;
    this.classList.toggle('active', showBots);
    this.innerHTML = showBots
      ? '<i class="fa-solid fa-robot"></i> Bots On'
      : '<i class="fa-solid fa-robot"></i> Bots Off';
    renderMembers();
  });

  /* 视图切换 */
  document.getElementById('view-toggle').addEventListener('click', function() {
    viewMode = viewMode === 'grid' ? 'list' : 'grid';
    const grid = document.getElementById('members-grid');
    grid.classList.toggle('list-view', viewMode === 'list');
    this.innerHTML = viewMode === 'grid'
      ? '<i class="fa-solid fa-list"></i>'
      : '<i class="fa-solid fa-grid-2"></i>';
    this.title = viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view';
    renderMembers();
  });

  /* 随机成员按钮 */
  document.getElementById('random-btn').addEventListener('click', randomSpotlight);

  /* 模态框点击外部关闭 */
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  /* 键盘快捷键 */
  document.addEventListener('keydown', (e) => {
    /* Escape 关闭模态框 */
    if (e.key === 'Escape') closeModal();
    /* / 聚焦搜索 */
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      searchInput.focus();
    }
    /* R 随机成员（不在输入框时） */
    if (e.key === 'r' && document.activeElement.tagName !== 'INPUT' && !document.getElementById('modal-overlay').classList.contains('open')) {
      randomSpotlight();
    }
  });
}

/* 页面加载后启动 */
document.addEventListener('DOMContentLoaded', init);
