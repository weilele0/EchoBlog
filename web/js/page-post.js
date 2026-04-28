/* ================================================
   EchoBlog — Page: Post Detail
   ================================================ */

const PagePost = {
  async load(id) {
    const el = document.getElementById('post-detail-content');
    el.innerHTML = spinnerHTML();
    try {
      const res = await PostAPI.getById(id);
      const p   = res.post;
      this.render(p);
    } catch(e) {
      el.innerHTML = emptyHTML('😕', '加载失败', e.message);
    }
  },

  render(p) {
    const el      = document.getElementById('post-detail-content');
    const cover   = Store.getCover(p.id);
    const catName = p.category?.Name || '';
    const user    = p.user?.username || '匿名';
    const uid     = p.user_id;
    const userAvatar = Store.getAvatar(uid);
    // Try to show display name
    const displayName = uid === App.user?.id ? Store.getDisplayName(App.user) : user;

    const avatarHTML = userAvatar
      ? `<img src="${userAvatar}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid var(--border)">`
      : `<div style="width:28px;height:28px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0">${(displayName[0]||'U').toUpperCase()}</div>`;

    el.innerHTML = `
      <div class="post-detail-card">
        ${cover ? `<div class="post-detail-cover"><img src="${cover}" alt="cover"></div>` : ''}
        <div class="post-detail-body">
          <div class="post-detail-meta">
            ${catName ? `<span class="post-card-cat">${escHtml(catName)}</span>` : ''}
            <span style="display:flex;align-items:center;gap:.4rem">
              ${avatarHTML}
              <strong>${escHtml(displayName)}</strong>
            </span>
            <span>📅 ${fmtDate(p.created_at)}</span>
            <span>👁️ ${p.views || 0} 次浏览</span>
          </div>
          <h1 class="post-detail-title">${escHtml(p.title)}</h1>
          ${(p.tags||[]).length ? `
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1rem">
              ${p.tags.map(t=>`<span class="tag-badge">#${escHtml(t.Name)}</span>`).join('')}
            </div>` : ''}
          <div class="post-detail-divider"></div>
          <div class="post-detail-content">${escHtml(p.content)}</div>
          <div class="post-detail-divider"></div>
          <!-- Author card at bottom -->
          <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0">
            ${userAvatar
              ? `<img src="${userAvatar}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--border)">`
              : `<div style="width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700">${(displayName[0]||'U').toUpperCase()}</div>`
            }
            <div>
              <div style="font-weight:700;font-size:.95rem">${escHtml(displayName)}</div>
              <div style="font-size:.8rem;color:var(--muted)">发布于 ${fmtDate(p.created_at)}</div>
            </div>
          </div>
        </div>
      </div>`;
  },
};
