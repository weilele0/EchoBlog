/* ================================================
   EchoBlog — Page: Profile (个人中心)
   ================================================ */

const PageProfile = {
  async init() {
    if (!App.user) { navigate('auth'); return; }

    const uid    = App.user.id;
    const name   = Store.getDisplayName(App.user);
    const avatar = Store.getAvatar(uid);
    const cover  = Store.getAvatar(`cover_${uid}`);

    // Render avatar
    const avEl = document.getElementById('profile-avatar');
    if (avEl) {
      avEl.innerHTML = avatar
        ? `<img src="${avatar}" alt="avatar">`
        : `<div class="profile-avatar-text">${(name[0]||'U').toUpperCase()}</div>`;
    }

    // Render cover
    const coverEl = document.getElementById('profile-cover-img');
    if (coverEl && cover) { coverEl.src = cover; coverEl.style.display = 'block'; }

    // Render name
    this._renderName();

    // UID
    const uidEl = document.getElementById('profile-uid');
    if (uidEl) uidEl.textContent = `UID: ${uid}`;

    // Original username hint
    const origEl = document.getElementById('profile-original-name');
    if (origEl) {
      const nickname = Store.getNickname(uid);
      if (nickname) {
        origEl.textContent = `用户名: ${App.user.username}`;
        origEl.style.display = '';
      } else {
        origEl.style.display = 'none';
      }
    }

    // Bio
    this._renderBio();

    // Location
    this._renderLocation();

    // Social links
    this._renderSocials();

    // Join date
    this._renderJoinDate();

    // Stats
    this._loadStats();
  },

  _renderName() {
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = Store.getDisplayName(App.user);
  },

  _renderBio() {
    const uid = App.user?.id;
    if (!uid) return;
    const bio = Store.getBio(uid);
    const bioText = document.getElementById('profile-bio-text');
    const bioArea = document.getElementById('profile-bio-area');

    if (bio) {
      bioText.className = '';
      bioText.style.fontStyle = 'normal';
      bioText.style.cursor = 'default';
      bioText.textContent = bio;
      // Make it clickable to edit
      bioArea.onclick = () => PageProfile.openEditProfileModal();
      bioArea.style.cursor = 'pointer';
    } else {
      bioText.className = 'profile-bio-empty';
      bioText.textContent = '还没有个人简介，点击添加...';
      bioArea.onclick = () => PageProfile.openEditProfileModal();
      bioArea.style.cursor = 'pointer';
    }
  },

  _renderLocation() {
    const uid = App.user?.id;
    if (!uid) return;
    const loc = Store.getLocation(uid);
    const locEl = document.getElementById('profile-location');
    const locText = document.getElementById('profile-location-text');
    if (loc) {
      locText.textContent = loc;
      locEl.style.display = '';
    } else {
      locEl.style.display = 'none';
    }
  },

  _renderSocials() {
    const uid = App.user?.id;
    if (!uid) return;
    const socials = Store.getSocials(uid);
    const container = document.getElementById('profile-socials');
    const links = [];
    if (socials.github)   links.push({ icon: '🐙', label: 'GitHub', url: socials.github });
    if (socials.twitter)  links.push({ icon: '🐦', label: 'Twitter', url: socials.twitter });
    if (socials.website)  links.push({ icon: '🌐', label: '博客', url: socials.website });
    if (socials.wechat)   links.push({ icon: '💬', label: '微信: ' + socials.wechat, url: null });

    if (links.length) {
      container.innerHTML = links.map(l => {
        if (l.url) {
          return `<a class="social-link" href="${escAttr(l.url)}" target="_blank" rel="noopener"><span class="social-icon">${l.icon}</span>${escHtml(l.label)}</a>`;
        }
        return `<span class="social-link"><span class="social-icon">${l.icon}</span>${escHtml(l.label)}</span>`;
      }).join('');
      container.style.display = '';
    } else {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  },

  _renderJoinDate() {
    const badge = document.getElementById('profile-join-badge');
    const text = document.getElementById('profile-join-text');
    // Use a fake join date based on current session (pure frontend)
    const joinDate = localStorage.getItem(`echo_joindate_${App.user?.id}`);
    if (joinDate) {
      text.textContent = `加入于 ${joinDate}`;
      badge.style.display = '';
    } else if (App.token) {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      localStorage.setItem(`echo_joindate_${App.user?.id}`, dateStr);
      text.textContent = `加入于 ${dateStr}`;
      badge.style.display = '';
    }
  },

  async _loadStats() {
    try {
      const res = await PostAPI.myPosts();
      const posts = res.posts || [];
      const totalPosts = posts.length;
      const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
      document.getElementById('profile-stat-posts').textContent = totalPosts;
      document.getElementById('profile-stat-views').textContent = totalViews.toLocaleString();
      document.getElementById('profile-stat-cats').textContent = App.categories.length;
      document.getElementById('profile-stats-card').style.display = '';
    } catch {
      // ignore
    }
  },

  // ===== 修改昵称（inline） =====
  openNicknameEditor() {
    if (!App.user) return;
    const uid = App.user.id;
    const currentNickname = Store.getNickname(uid);
    const nameEl = document.getElementById('profile-name');
    if (!nameEl) return;
    const displayValue = currentNickname || App.user.username;

    nameEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:.5rem">
        <input class="form-control" id="nickname-input" type="text" 
               value="${escAttr(displayValue)}" 
               placeholder="输入新昵称…" 
               maxlength="20"
               style="width:200px;text-align:center;font-size:1.25rem;font-weight:700;padding:.4rem .6rem">
        <button class="btn btn-primary btn-sm" onclick="PageProfile.saveNickname()" title="保存">✓</button>
        <button class="btn btn-ghost btn-sm" onclick="PageProfile.cancelNicknameEdit()" title="取消">✕</button>
      </div>
    `;
    const input = document.getElementById('nickname-input');
    if (input) {
      input.focus();
      input.select();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  PageProfile.saveNickname();
        if (e.key === 'Escape') PageProfile.cancelNicknameEdit();
      });
    }
  },

  saveNickname() {
    if (!App.user) return;
    const input = document.getElementById('nickname-input');
    if (!input) return;
    const newNickname = input.value.trim();
    if (!newNickname) { Toast.warning('昵称不能为空'); return; }
    if (newNickname.length > 20) { Toast.warning('昵称最多 20 个字符'); return; }

    const uid = App.user.id;
    const bio = Store.getBio(uid);

    // 同步到后端
    UserAPI.updateProfile(newNickname, bio)
      .then(() => {
        if (newNickname === App.user.username) {
          Store.removeNickname(uid);
          Toast.info('昵称已重置为用户名');
        } else {
          Store.setNickname(uid, newNickname);
          Toast.success('昵称修改成功');
        }
        this._renderName();
        const origEl = document.getElementById('profile-original-name');
        if (origEl) {
          const nickname = Store.getNickname(uid);
          if (nickname) { origEl.textContent = `用户名: ${App.user.username}`; origEl.style.display = ''; }
          else { origEl.style.display = 'none'; }
        }
        refreshNavbar();
      })
      .catch((err) => {
        Toast.error(err.message || '昵称修改失败');
      });
  },

  cancelNicknameEdit() { this._renderName(); },

  // ===== 上传头像 =====
  uploadAvatar() {
    pickImage('image/*', (data) => {
      const uid = App.user?.id;
      if (!uid) return;
      Store.setAvatar(uid, data);
      const avEl = document.getElementById('profile-avatar');
      if (avEl) avEl.innerHTML = `<img src="${data}" alt="avatar">`;
      const navAv = document.getElementById('nav-avatar');
      if (navAv) navAv.innerHTML = `<img src="${data}" alt="avatar">`;
      Toast.success('头像已更新');
    });
  },

  // ===== 上传封面 =====
  uploadCover() {
    pickImage('image/*', (data) => {
      const uid = App.user?.id;
      if (!uid) return;
      Store.setAvatar(`cover_${uid}`, data);
      const coverEl = document.getElementById('profile-cover-img');
      if (coverEl) { coverEl.src = data; coverEl.style.display = 'block'; }
      Toast.success('封面已更新');
    });
  },

  // ===== 编辑资料 Modal =====
  openEditProfileModal() {
    if (!App.user) return;
    const uid = App.user.id;
    document.getElementById('edit-username-display').value = App.user.username;
    document.getElementById('edit-nickname').value = Store.getNickname(uid) || '';
    document.getElementById('edit-bio').value = Store.getBio(uid) || '';
    document.getElementById('edit-location').value = Store.getLocation(uid) || '';
    const socials = Store.getSocials(uid);
    document.getElementById('edit-social-github').value = socials.github || '';
    document.getElementById('edit-social-twitter').value = socials.twitter || '';
    document.getElementById('edit-social-website').value = socials.website || '';
    document.getElementById('edit-social-wechat').value = socials.wechat || '';
    document.getElementById('profile-edit-modal').classList.add('open');
  },
};

/* -------- Profile Edit Modal -------- */
const ProfileEditModal = {
  close() {
    document.getElementById('profile-edit-modal').classList.remove('open');
  },

  save() {
    if (!App.user) return;
    const uid = App.user.id;

    // Nickname
    const nickname = document.getElementById('edit-nickname').value.trim();
    if (nickname && nickname.length > 20) { Toast.warning('昵称最多 20 个字符'); return; }

    // Bio
    const bio = document.getElementById('edit-bio').value.trim();
    if (bio && bio.length > 200) { Toast.warning('简介最多 200 个字符'); return; }

    // 同步到后端
    UserAPI.updateProfile(nickname, bio)
      .then((res) => {
        // 更新本地缓存（以服务端数据为准）
        if (res.user) {
          if (res.user.nickname && res.user.nickname !== App.user.username) {
            Store.setNickname(uid, res.user.nickname);
          } else {
            Store.removeNickname(uid);
          }
          if (res.user.bio) {
            Store.setBio(uid, res.user.bio);
          } else {
            Store.removeBio(uid);
          }
        }

        // Location & Socials 仍为纯前端存储
        const location = document.getElementById('edit-location').value.trim();
        if (location) { Store.setLocation(uid, location); } else { Store.removeLocation(uid); }

        const socials = {};
        const gh = document.getElementById('edit-social-github').value.trim();
        const tw = document.getElementById('edit-social-twitter').value.trim();
        const ws = document.getElementById('edit-social-website').value.trim();
        const wc = document.getElementById('edit-social-wechat').value.trim();
        if (gh) socials.github = gh;
        if (tw) socials.twitter = tw;
        if (ws) socials.website = ws;
        if (wc) socials.wechat = wc;
        Store.setSocials(uid, socials);

        Toast.success('资料已保存');
        this.close();
        PageProfile.init();
        refreshNavbar();
      })
      .catch((err) => {
        Toast.error(err.message || '保存失败，请重试');
      });
  },
};
