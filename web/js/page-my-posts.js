/* ================================================
   EchoBlog — Page: My Posts + Post Modal
   ================================================ */

/* -------- My Posts -------- */
const PageMyPosts = {
  async init() {
    const el = document.getElementById('my-posts-list');
    el.innerHTML = spinnerHTML();
    try {
      const res   = await PostAPI.myPosts();
      const posts = res.posts || [];
      if (!posts.length) {
        el.innerHTML = emptyHTML('📝', '还没有文章', '快去写第一篇博文吧！');
        return;
      }
      el.innerHTML = posts.map(p => this.itemHTML(p)).join('');
    } catch(e) {
      el.innerHTML = emptyHTML('😕', '加载失败', e.message);
    }
  },

  itemHTML(p) {
    const cover = Store.getCover(p.id);
    const thumbHTML = cover
      ? `<div class="my-post-thumb"><img src="${cover}" alt=""></div>`
      : `<div class="my-post-thumb"><div class="my-post-thumb-ph">📄</div></div>`;

    return `
      <div class="my-post-item">
        ${thumbHTML}
        <div class="my-post-info">
          <div class="my-post-title" title="${escAttr(p.title)}">${escHtml(p.title)}</div>
          <div class="my-post-meta">
            <span>📅 ${fmtDate(p.created_at)}</span>
            <span>👁️ ${p.views || 0}</span>
            ${p.category?.Name ? `<span>📂 ${escHtml(p.category.Name)}</span>` : ''}
          </div>
        </div>
        <div class="my-post-actions">
          <button class="btn btn-outline btn-sm"
            onclick="PostModal.openEdit(${p.id}, '${escAttr(p.title)}', '${escAttr(p.content)}', ${p.category_id||0})">
            ✏️ 编辑
          </button>
          <button class="btn btn-sm" style="border-color:var(--danger);color:var(--danger)"
            onclick="ConfirmModal.open(${p.id})">
            🗑️ 删除
          </button>
        </div>
      </div>`;
  },
};

/* -------- Post Modal -------- */
const PostModal = {
  editId: null,
  coverData: null, // 当前 modal 中暂存的封面 base64

  fillCategories() {
    const sel = document.getElementById('post-category');
    if (!sel) return;
    sel.innerHTML = '<option value="0">无分类</option>' +
      App.categories.map(c => `<option value="${c.ID}">${escHtml(c.Name)}</option>`).join('');
  },

  openNew() {
    this.editId   = null;
    this.coverData = Store.getDraftCover() || null;
    document.getElementById('modal-title').textContent = '✍️ 发布文章';
    document.getElementById('post-title').value   = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-category').value = '0';
    document.getElementById('btn-submit-post').textContent = '发布';
    this._renderCoverPreview();
    document.getElementById('post-modal').classList.add('open');
  },

  openEdit(id, title, content, catId) {
    this.editId   = id;
    this.coverData = Store.getCover(id) || null;
    document.getElementById('modal-title').textContent = '✏️ 编辑文章';
    document.getElementById('post-title').value   = title;
    document.getElementById('post-content').value = content;
    document.getElementById('post-category').value = catId;
    document.getElementById('btn-submit-post').textContent = '保存';
    this._renderCoverPreview();
    document.getElementById('post-modal').classList.add('open');
  },

  close() {
    document.getElementById('post-modal').classList.remove('open');
    Store.clearDraftCover();
    this.coverData = null;
  },

  pickCover() {
    pickImage('image/*', (data) => {
      this.coverData = data;
      this._renderCoverPreview();
      Toast.success('封面图已更换');
    });
  },

  removeCover() {
    this.coverData = null;
    this._renderCoverPreview();
  },

  _renderCoverPreview() {
    const area = document.getElementById('cover-upload-area');
    if (!area) return;
    const data = this.coverData;
    if (data) {
      area.innerHTML = `
        <img src="${data}" alt="cover">
        <div class="cover-upload-overlay">
          <span>🔄 更换封面</span>
        </div>`;
    } else {
      area.innerHTML = `
        <span class="cover-upload-icon">🖼️</span>
        <span class="cover-upload-text">点击上传封面图</span>
        <span class="cover-upload-hint">JPG / PNG，建议 16:9，最大 2MB</span>`;
    }
  },

  async submit() {
    const title      = document.getElementById('post-title').value.trim();
    const content    = document.getElementById('post-content').value.trim();
    const categoryID = parseInt(document.getElementById('post-category').value) || 0;
    if (!title)   { Toast.error('标题不能为空'); return; }
    if (!content) { Toast.error('内容不能为空'); return; }

    const btn = document.getElementById('btn-submit-post');
    btn.disabled = true;
    try {
      let savedId;
      if (this.editId) {
        await PostAPI.update(this.editId, title, content, categoryID);
        savedId = this.editId;
        Toast.success('文章更新成功 ✅');
      } else {
        const res = await PostAPI.create(title, content, categoryID);
        savedId = res.post?.id;
        Toast.success('文章发布成功 🎉');
      }
      // 保存封面图到 localStorage
      if (savedId) {
        if (this.coverData) {
          Store.setCover(savedId, this.coverData);
        } else if (this.editId) {
          // 编辑时封面被清除
          Store.removeCover(this.editId);
        }
      }
      Store.clearDraftCover();
      this.close();
      PageMyPosts.init();
    } catch(e) {
      Toast.error(e.message);
    } finally {
      btn.disabled = false;
    }
  },
};

/* -------- Confirm Delete Modal -------- */
const ConfirmModal = {
  targetId: null,

  open(id) {
    this.targetId = id;
    document.getElementById('confirm-modal').classList.add('open');
  },
  close() {
    this.targetId = null;
    document.getElementById('confirm-modal').classList.remove('open');
  },

  async confirm() {
    if (!this.targetId) return;
    const btn = document.getElementById('btn-confirm-del');
    btn.disabled = true;
    try {
      await PostAPI.delete(this.targetId);
      Store.removeCover(this.targetId);
      Toast.success('文章已删除');
      this.close();
      PageMyPosts.init();
    } catch(e) {
      Toast.error(e.message);
    } finally {
      btn.disabled = false;
    }
  },
};
