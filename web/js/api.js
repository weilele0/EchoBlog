/* ================================================
   EchoBlog — API Layer
   Base: /api  (同域，Gin 提供静态服务)
   ================================================ */

const API_BASE = '/api';

/**
 * 核心请求函数
 * @param {string} path
 * @param {string} method
 * @param {object|null} body
 * @param {boolean} auth  - 是否携带 JWT
 * @returns {Promise<any>}
 */
async function request(path, method = 'GET', body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Store.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
  return data;
}

/* ---- User APIs ---- */
const UserAPI = {
  register: (username, password, email) =>
    request('/user/register', 'POST', { username, password, email }),

  login: (username, password) =>
    request('/user/login', 'POST', { username, password }),

  getMe: () =>
    request('/user/me', 'GET', null, true),

  updateProfile: (nickname, bio) =>
    request('/user/profile', 'PUT', { nickname, bio }, true),
};

/* ---- Post APIs ---- */
const PostAPI = {
  list: (page = 1, pageSize = 10, categoryID = 0) => {
    let url = `/posts?page=${page}&page_size=${pageSize}`;
    if (categoryID) url += `&category_id=${categoryID}`;
    return request(url);
  },

  getById: (id) =>
    request(`/posts/${id}`),

  create: (title, content, categoryID, tagIDs = []) =>
    request('/posts', 'POST', { title, content, category_id: categoryID, tag_ids: tagIDs }, true),

  update: (id, title, content, categoryID, tagIDs = []) =>
    request(`/posts/${id}`, 'PUT', { title, content, category_id: categoryID, tag_ids: tagIDs }, true),

  delete: (id) =>
    request(`/posts/${id}`, 'DELETE', null, true),

  myPosts: () =>
    request('/my/posts', 'GET', null, true),
};

/* ---- Category APIs ---- */
const CategoryAPI = {
  list: () => request('/categories'),
};
