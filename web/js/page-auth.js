/* ================================================
   EchoBlog — Page: Auth (Login / Register)
   ================================================ */

const PageAuth = {
  init(tab = 'login') {
    this.switchTab(tab);
    // Clear fields
    ['login-username','login-password','reg-username','reg-email','reg-password']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  },

  switchTab(tab) {
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
    document.getElementById('auth-tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('auth-tab-reg').classList.toggle('active', tab === 'register');
  },

  async doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!username || !password) { Toast.error('请填写用户名和密码'); return; }

    const btn = document.getElementById('btn-login');
    btn.disabled = true; btn.textContent = '登录中…';
    try {
      const res = await UserAPI.login(username, password);
      App.setToken(res.token);
      // Fetch user info
      const me = await UserAPI.getMe();
      App.user = { id: me.user_id, username: me.username };
      Store.setUser(App.user);
      refreshNavbar();
      Toast.success(`欢迎回来，${App.user.username} 🎉`);
      navigate('home');
    } catch(e) {
      Toast.error(e.message);
    } finally {
      btn.disabled = false; btn.textContent = '登 录';
    }
  },

  async doRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    if (!username || !email || !password) { Toast.error('请填写完整信息'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { Toast.error('邮箱格式不正确'); return; }
    if (password.length < 6) { Toast.error('密码至少 6 位'); return; }

    const btn = document.getElementById('btn-register');
    btn.disabled = true; btn.textContent = '注册中…';
    try {
      await UserAPI.register(username, password, email);
      Toast.success('注册成功，请登录');
      this.switchTab('login');
      document.getElementById('login-username').value = username;
    } catch(e) {
      Toast.error(e.message);
    } finally {
      btn.disabled = false; btn.textContent = '注 册';
    }
  },
};

function doLogout() {
  App.clearAuth();
  refreshNavbar();
  Toast.info('已退出登录');
  navigate('home');
}
