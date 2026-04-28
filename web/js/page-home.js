/* ================================================
   EchoBlog — Page: Home (文章列表)
   ================================================ */

const PageHome = {
  async init() {
    this.renderCategoryChips();
    this.renderSidebar();
    await this.loadPosts();
  },

  renderCategoryChips() {
    const el = document.getElementById('cat-chips');
    if (!el) return;
    const active = App.home.categoryID;
    el.innerHTML = `
      <div class="cat-chip ${active===0?'active':''}" data-id="0">全部</div>
      ${App.categories.map(c => `
        <div class="cat-chip ${active===c.ID?'active':''}" data-id="${c.ID}">${escHtml(c.Name)}</div>
      `).join('')}`;
    el.querySelectorAll('.cat-chip').forEach(chip => {
      chip.onclick = () => {
        App.home.categoryID = parseInt(chip.dataset.id);
        App.home.page = 1;
        this.renderCategoryChips();
        this.renderSidebar();
        this.loadPosts();
      };
    });
  },

  renderSidebar() {
    const el = document.getElementById('sidebar-cat-list');
    if (!el) return;
    const active = App.home.categoryID;
    el.innerHTML = `
      <div class="sidebar-cat-item ${active===0?'active':''}" data-id="0">
        <span>📝 全部文章</span>
        <span class="cat-count">${App.home.total || ''}</span>
      </div>
      ${App.categories.map(c => `
        <div class="sidebar-cat-item ${active===c.ID?'active':''}" data-id="${c.ID}">
          <span>${escHtml(c.Name)}</span>
        </div>
      `).join('')}`;
    el.querySelectorAll('.sidebar-cat-item').forEach(item => {
      item.onclick = () => {
        App.home.categoryID = parseInt(item.dataset.id);
        App.home.page = 1;
        this.renderCategoryChips();
        this.renderSidebar();
        this.loadPosts();
      };
    });
  },

  async loadPosts() {
    const grid  = document.getElementById('posts-grid');
    const stats = document.getElementById('sidebar-stats');
    grid.innerHTML = spinnerHTML();

    try {
      const { page, pageSize, categoryID } = App.home;
      const res  = await PostAPI.list(page, pageSize, categoryID);
      const posts = res.posts || [];
      App.home.total = res.total || 0;

      this.renderSidebar(); // update total count

      if (!posts.length) {
        grid.innerHTML = emptyHTML('📭', '暂无文章', '当前分类下还没有文章，快去发布第一篇吧！');
      } else {
        grid.innerHTML = posts.map(p => this.postCardHTML(p)).join('');
        // bind click
        grid.querySelectorAll('.post-card').forEach(card => {
          card.onclick = () => navigate('post', { postId: parseInt(card.dataset.id) });
        });
      }

      this.renderPagination();

      // sidebar stats
      if (stats) {
        stats.classList.remove('hidden');
        document.getElementById('stat-total').textContent = App.home.total;
        document.getElementById('stat-cats').textContent  = App.categories.length;
      }
    } catch(e) {
      grid.innerHTML = emptyHTML('😕', '加载失败', e.message);
    }
  },

  postCardHTML(p) {
    const cover = Store.getCover(p.id);
    const catName = p.category?.Name || '';
    const uid     = p.user_id;
    // Show display name if it's current user, otherwise show username
    const user = (uid === App.user?.id) ? Store.getDisplayName(App.user) : (p.user?.username || '匿名');
    const userAvatar = Store.getAvatar(uid);

    const coverHTML = cover
      ? `<div class="post-card-cover"><img src="${cover}" alt="cover"><div class="post-card-cover-placeholder"></div></div>`
      : `<div class="post-card-cover"><div class="post-card-cover-placeholder">📄</div></div>`;

    const avatarHTML = userAvatar
      ? `<img src="${userAvatar}" alt="">`
      : `<span>${(user[0]||'U').toUpperCase()}</span>`;

    return `
      <div class="post-card" data-id="${p.id}">
        ${coverHTML}
        <div class="post-card-body">
          <div class="post-card-meta">
            ${catName ? `<span class="post-card-cat">${escHtml(catName)}</span>` : ''}
            <span>👁️ ${p.views || 0}</span>
            <span class="meta-dot">·</span>
            <span>${timeAgo(p.created_at)}</span>
          </div>
          <div class="post-card-title">${escHtml(p.title)}</div>
          <div class="post-card-excerpt">${escHtml(excerpt(p.content))}</div>
          <div class="post-card-footer">
            <div class="post-author">
              <div class="post-author-avatar">${avatarHTML}</div>
              <span>${escHtml(user)}</span>
            </div>
            <div class="post-tags">
              ${(p.tags||[]).slice(0,3).map(t=>`<span class="tag-badge">#${escHtml(t.Name)}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
  },

  renderPagination() {
    const el    = document.getElementById('pagination');
    const total = Math.ceil(App.home.total / App.home.pageSize);
    const cur   = App.home.page;
    if (total <= 1) { el.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="PageHome.goPage(${cur-1})" ${cur===1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= total; i++) {
      if (total > 7 && i !== 1 && i !== total && Math.abs(i - cur) > 2) {
        if (i === cur - 3 || i === cur + 3) html += `<span class="page-ellipsis">…</span>`;
        continue;
      }
      html += `<button class="page-btn${i===cur?' active':''}" onclick="PageHome.goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="PageHome.goPage(${cur+1})" ${cur===total?'disabled':''}>›</button>`;
    el.innerHTML = html;
  },

  goPage(p) {
    App.home.page = p;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};
