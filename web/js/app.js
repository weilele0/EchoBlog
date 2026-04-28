/* ================================================
   EchoBlog — App Core
   State management, navigation, navbar
   ================================================ */

/* ======== APP STATE ======== */
const App = {
  token:      Store.getToken(),
  user:       Store.getUser(),
  categories: [],

  home: { page: 1, pageSize: 10, categoryID: 0, total: 0 },

  setToken(t) { this.token = t; Store.setToken(t); },
  clearAuth()  { this.token = ''; this.user = null; Store.removeToken(); Store.removeUser(); },
};

/* ======== NAVBAR ======== */
function refreshNavbar() {
  const loggedIn = !!App.token && !!App.user;
  document.getElementById('nav-auth-btn').classList.toggle('hidden', loggedIn);
  document.getElementById('nav-user-area').classList.toggle('hidden', !loggedIn);
  if (loggedIn) {
    const uid = App.user.id;
    const avatar = Store.getAvatar(uid);
    const navAv = document.getElementById('nav-avatar');
    const displayName = Store.getDisplayName(App.user);
    if (avatar) {
      navAv.innerHTML = `<img src="${avatar}" alt="avatar">`;
    } else {
      navAv.innerHTML = `<div class="nav-avatar-text">${displayName[0].toUpperCase()}</div>`;
    }
    document.getElementById('nav-username').textContent = displayName;
  }
}

/* ======== NAVIGATION ======== */
const PAGES = ['home','post','auth','my-posts','profile'];

function navigate(name, opts = {}) {
  PAGES.forEach(p => {
    document.getElementById(`page-${p}`)?.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));

  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-page="${name}"]`);
  if (navBtn) navBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger page load
  if (name === 'home')      PageHome.init();
  if (name === 'post')      PagePost.load(opts.postId);
  if (name === 'my-posts')  PageMyPosts.init();
  if (name === 'profile')   PageProfile.init();
  if (name === 'auth')      PageAuth.init(opts.tab);
}

function requireAuth(name, opts = {}) {
  if (!App.token) { Toast.info('请先登录'); navigate('auth'); return; }
  navigate(name, opts);
}

/* ======== INIT ======== */
async function bootstrap() {
  // Restore login
  if (App.token && App.user) {
    try {
      const res = await UserAPI.getMe();
      App.user = { id: res.user_id, username: res.username };
      Store.setUser(App.user);
      // 同步后端存储的 nickname 和 bio 到本地缓存
      const uid = res.user_id;
      if (res.nickname) {
        Store.setNickname(uid, res.nickname);
      } else {
        Store.removeNickname(uid);
      }
      if (res.bio) {
        Store.setBio(uid, res.bio);
      } else {
        Store.removeBio(uid);
      }
    } catch {
      App.clearAuth();
    }
  }
  refreshNavbar();

  // Load categories
  try {
    const res = await CategoryAPI.list();
    App.categories = res.categories || [];
    PageHome.renderCategoryChips();
    PageHome.renderSidebar();
    PostModal.fillCategories();
  } catch {}

  navigate('home');
}
