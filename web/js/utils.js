/* ================================================
   EchoBlog — Utils & Store
   ================================================ */

/* ---- LocalStorage Store ---- */
const Store = {
  getToken:    ()    => localStorage.getItem('echo_token') || '',
  setToken:    (t)   => localStorage.setItem('echo_token', t),
  removeToken: ()    => localStorage.removeItem('echo_token'),

  getUser:     ()    => { try { return JSON.parse(localStorage.getItem('echo_user') || 'null'); } catch { return null; } },
  setUser:     (u)   => localStorage.setItem('echo_user', JSON.stringify(u)),
  removeUser:  ()    => localStorage.removeItem('echo_user'),

  // 头像：key = 'avatar_{userID}'，值为 base64 DataURL
  getAvatar:   (uid) => localStorage.getItem(`echo_avatar_${uid}`) || '',
  setAvatar:   (uid, data) => localStorage.setItem(`echo_avatar_${uid}`, data),

  // 封面图：key = 'cover_{postID}'，值为 base64 DataURL
  getCover:    (pid) => localStorage.getItem(`echo_cover_${pid}`) || '',
  setCover:    (pid, data) => localStorage.setItem(`echo_cover_${pid}`, data),
  removeCover: (pid) => localStorage.removeItem(`echo_cover_${pid}`),

  // 草稿封面（发布前暂存）
  getDraftCover:    ()     => sessionStorage.getItem('echo_draft_cover') || '',
  setDraftCover:    (data) => sessionStorage.setItem('echo_draft_cover', data),
  clearDraftCover:  ()     => sessionStorage.removeItem('echo_draft_cover'),

  // 显示昵称（纯前端，不改后端）
  getNickname:  (uid) => localStorage.getItem(`echo_nickname_${uid}`) || '',
  setNickname:  (uid, name) => localStorage.setItem(`echo_nickname_${uid}`, name),
  removeNickname: (uid) => localStorage.removeItem(`echo_nickname_${uid}`),

  /** 获取显示名称：优先用昵称，没有则用 username */
  getDisplayName: (user) => {
    if (!user) return '未知用户';
    const nickname = Store.getNickname(user.id);
    return nickname || user.username;
  },

  // 个人简介
  getBio:     (uid) => localStorage.getItem(`echo_bio_${uid}`) || '',
  setBio:     (uid, bio) => localStorage.setItem(`echo_bio_${uid}`, bio),
  removeBio:  (uid) => localStorage.removeItem(`echo_bio_${uid}`),

  // 个人所在地
  getLocation: (uid) => localStorage.getItem(`echo_location_${uid}`) || '',
  setLocation: (uid, loc) => localStorage.setItem(`echo_location_${uid}`, loc),
  removeLocation: (uid) => localStorage.removeItem(`echo_location_${uid}`),

  // 社交链接（JSON 对象）
  getSocials: (uid) => {
    try { return JSON.parse(localStorage.getItem(`echo_socials_${uid}`) || '{}'); } catch { return {}; }
  },
  setSocials: (uid, obj) => localStorage.setItem(`echo_socials_${uid}`, JSON.stringify(obj)),

  // 网站信息（管理员可配）
  getSiteInfo: () => {
    try { return JSON.parse(localStorage.getItem('echo_site_info') || '{}'); } catch { return {}; }
  },
  setSiteInfo: (obj) => localStorage.setItem('echo_site_info', JSON.stringify(obj)),
};

/* ---- Toast ---- */
const Toast = {
  show(msg, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${escHtml(msg)}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastIn .25s ease reverse forwards';
      setTimeout(() => el.remove(), 250);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  info:    (msg) => Toast.show(msg, 'info'),
  warning: (msg) => Toast.show(msg, 'warning'),
};

/* ---- HTML helpers ---- */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(str) {
  return String(str ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'');
}

/* ---- Date formatting ---- */
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} 天前`;
  return fmtDate(dateStr);
}

/* ---- Text excerpt ---- */
function excerpt(text, len = 130) {
  const s = (text || '').replace(/\s+/g, ' ').trim();
  return s.length > len ? s.slice(0, len) + '…' : s;
}

/* ---- Spinner HTML ---- */
function spinnerHTML() {
  return '<div class="spinner-wrap"><div class="spinner"></div></div>';
}

/* ---- Image file → base64 ---- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject('no file'); return; }
    const maxMB = 2;
    if (file.size > maxMB * 1024 * 1024) { reject(`图片不能超过 ${maxMB}MB`); return; }
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject('读取文件失败');
    reader.readAsDataURL(file);
  });
}

/* ---- Trigger hidden file input ---- */
function pickImage(accept, callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept || 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await fileToBase64(file);
      callback(data);
    } catch(err) {
      Toast.error(typeof err === 'string' ? err : '图片处理失败');
    }
  };
  input.click();
}

/* ---- Empty state HTML ---- */
function emptyHTML(icon, title, desc) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${escHtml(title)}</h3>
      <p>${escHtml(desc)}</p>
    </div>`;
}
