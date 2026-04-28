# EchoBlog API 接口文档

## 一、接口概览

| 分类 | 路径 | 方法 | 认证 | 说明 |
|------|------|------|------|------|
| 用户 | `/api/user/register` | POST | ❌ | 用户注册 |
| 用户 | `/api/user/login` | POST | ❌ | 用户登录 |
| 用户 | `/api/user/me` | GET | ✅ | 获取当前用户 |
| 用户 | `/api/user/profile` | PUT | ✅ | 更新个人资料 |
| 文章 | `/api/posts` | GET | ❌ | 文章列表 |
| 文章 | `/api/posts/:id` | GET | ❌ | 文章详情 |
| 文章 | `/api/posts` | POST | ✅ | 发布文章 |
| 文章 | `/api/posts/:id` | PUT | ✅ | 编辑文章 |
| 文章 | `/api/posts/:id` | DELETE | ✅ | 删除文章 |
| 文章 | `/api/my/posts` | GET | ✅ | 我的文章列表 |
| 分类 | `/api/categories` | GET | ❌ | 分类列表 |

> ✅ = 需要 JWT 认证 | ❌ = 公开接口

---

## 二、通用说明

### 请求头

认证接口需在请求头中携带 Token：

```
Authorization: Bearer <token>
```

### 响应格式

所有接口统一 JSON 响应：

**成功**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

**错误**
```json
{
  "error": "错误描述"
}
```

### HTTP 状态码

| 状态码 | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / Token 无效 |
| 403 | 无权操作（尝试编辑/删除他人文章） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 三、接口详情

---

### 3.1 用户注册

```
POST /api/user/register
```

#### 请求参数（JSON Body）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名，3-20 个字符，唯一 |
| email | string | ✅ | 有效邮箱地址 |
| password | string | ✅ | 至少 6 位 |

#### 请求示例

```json
{
  "username": "alice",
  "email":    "alice@example.com",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "message": "注册成功",
  "user": {
    "id":       1,
    "username": "alice",
    "email":    "alice@example.com",
    "nickname": "",
    "bio":      ""
  }
}
```

#### 错误码

| 错误信息 | 原因 |
|------|------|
| `Key: 'RegisterReq.Username' Error:Field validation` | 用户名为空 |
| `Key: 'RegisterReq.Email' Error:Field validation` | 邮箱格式错误 |
| `Key: 'RegisterReq.Password' Error:Field validation` | 密码为空或过短 |
| `用户名已存在` | 用户名重复 |

---

### 3.2 用户登录

```
POST /api/user/login
```

#### 请求参数（JSON Body）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |

#### 请求示例

```json
{
  "username": "alice",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> 获取 Token 后，存储到前端（如 localStorage），后续请求携带在 `Authorization` 头中。

---

### 3.3 获取当前用户

```
GET /api/user/me
```

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "code":     200,
  "message":  "获取成功",
  "user_id":  1,
  "username": "alice",
  "nickname": "小艾",
  "bio":      "热爱写作的博主"
}
```

---

### 3.4 更新个人资料

```
PUT /api/user/profile
```

#### 请求头

```
Authorization: Bearer <token>
```

#### 请求参数（JSON Body）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | ❌ | 昵称，最长 20 字符 |
| bio | string | ❌ | 个人简介，最长 200 字符 |

#### 请求示例

```json
{
  "nickname": "小艾",
  "bio":      "热爱写作的博主，专注技术分享"
}
```

#### 响应示例

```json
{
  "code":    200,
  "message": "资料更新成功",
  "user": {
    "user_id":  1,
    "username": "alice",
    "nickname": "小艾",
    "bio":      "热爱写作的博主，专注技术分享"
  }
}
```

---

### 3.5 获取文章列表

```
GET /api/posts
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | ❌ | 页码，默认 1 |
| page_size | int | ❌ | 每页条数，默认 10 |
| category_id | int | ❌ | 分类 ID，筛选指定分类文章 |

#### 请求示例

```
GET /api/posts?page=1&page_size=10&category_id=2
```

#### 响应示例

```json
{
  "posts": [
    {
      "id":          1,
      "title":      "Go 语言入门教程",
      "content":     "这是文章内容摘要...",
      "cover_image": "/uploads/cover_1.jpg",
      "views":      128,
      "status":      1,
      "created_at": "2026-01-15T10:30:00Z",
      "user": {
        "id":       1,
        "username": "alice",
        "nickname": "小艾",
        "avatar":   "/uploads/avatar_1.jpg"
      },
      "category": {
        "id":   2,
        "name": "技术"
      },
      "tags": [
        { "id": 1, "name": "Go" },
        { "id": 2, "name": "教程" }
      ]
    }
  ],
  "total": 25,
  "page":  1
}
```

---

### 3.6 获取文章详情

```
GET /api/posts/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 文章 ID |

#### 响应示例

```json
{
  "post": {
    "id":         1,
    "title":      "Go 语言入门教程",
    "content":    "这里是完整的文章正文内容...",
    "cover_image": "/uploads/cover_1.jpg",
    "views":      129,
    "status":      1,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z",
    "user": {
      "id":       1,
      "username": "alice",
      "nickname": "小艾",
      "avatar":   "/uploads/avatar_1.jpg",
      "bio":      "热爱写作的博主"
    },
    "category": {
      "id":          2,
      "name":        "技术",
      "description": "技术相关文章"
    },
    "tags": [
      { "id": 1, "name": "Go" },
      { "id": 2, "name": "教程" }
    ]
  }
}
```

#### 错误码

| 状态码 | 错误信息 | 原因 |
|------|------|------|
| 400 | `无效的文章ID` | ID 格式错误或非数字 |
| 404 | `文章不存在` | 文章被删除或 ID 不存在 |

---

### 3.7 发布文章

```
POST /api/posts
```

#### 请求头

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数（JSON Body）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 文章标题 |
| content | string | ✅ | 文章正文 |
| category_id | uint | ❌ | 分类 ID，不传则为"无分类" |
| tag_ids | []uint | ❌ | 标签 ID 数组 |

#### 请求示例

```json
{
  "title":      "Go 语言并发编程详解",
  "content":    "Goroutine 是 Go 语言的核心特性...",
  "category_id": 2,
  "tag_ids":    [1, 3]
}
```

#### 响应示例

```json
{
  "message": "文章发布成功",
  "post": {
    "id":    5,
    "title": "Go 语言并发编程详解"
  }
}
```

---

### 3.8 编辑文章

```
PUT /api/posts/:id
```

#### 请求头

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 文章 ID |

#### 请求参数（JSON Body）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 文章标题 |
| content | string | ✅ | 文章正文 |
| category_id | uint | ❌ | 分类 ID |
| tag_ids | []uint | ❌ | 标签 ID 数组 |

#### 响应示例

```json
{
  "message": "文章编辑成功"
}
```

#### 错误码

| 状态码 | 错误信息 | 原因 |
|------|------|------|
| 400 | `无权限编辑此文章` | 当前用户不是文章作者 |
| 404 | `文章不存在` | 文章不存在或已删除 |

---

### 3.9 删除文章

```
DELETE /api/posts/:id
```

#### 请求头

```
Authorization: Bearer <token>
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 文章 ID |

#### 响应示例

```json
{
  "message": "文章删除成功"
}
```

#### 错误码

| 状态码 | 错误信息 | 原因 |
|------|------|------|
| 400 | `无权限删除此文章` | 当前用户不是文章作者 |
| 404 | `文章不存在` | 文章不存在或已删除 |

> 采用软删除，数据可恢复。

---

### 3.10 获取我的文章列表

```
GET /api/my/posts
```

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "posts": [
    {
      "id":         1,
      "title":      "Go 语言入门教程",
      "cover_image": "/uploads/cover_1.jpg",
      "views":      128,
      "status":      1,
      "created_at": "2026-01-15T10:30:00Z",
      "category": {
        "id":   2,
        "name": "技术"
      }
    }
  ]
}
```

---

### 3.11 获取分类列表

```
GET /api/categories
```

#### 响应示例

```json
{
  "categories": [
    {
      "id":          1,
      "name":        "生活",
      "description": "生活感悟与日常分享"
    },
    {
      "id":          2,
      "name":        "技术",
      "description": "技术相关文章"
    }
  ]
}
```

---

## 四、前端接口调用说明

所有 API 请求统一封装在 `web/js/api.js` 中，认证接口会自动携带 Token：

```javascript
// 登录示例
const res = await fetch('/api/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const data = await res.json();
if (data.token) {
  localStorage.setItem('token', data.token);  // 存储 Token
}

// 认证请求示例
const res = await fetch('/api/user/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
});
```

---

## 五、接口索引

| # | 方法 | 路径 | 认证 | 说明 |
|---|------|------|------|------|
| 1 | POST | `/api/user/register` | ❌ | 用户注册 |
| 2 | POST | `/api/user/login` | ❌ | 用户登录 |
| 3 | GET | `/api/user/me` | ✅ | 获取当前用户 |
| 4 | PUT | `/api/user/profile` | ✅ | 更新资料 |
| 5 | GET | `/api/posts` | ❌ | 文章列表 |
| 6 | GET | `/api/posts/:id` | ❌ | 文章详情 |
| 7 | POST | `/api/posts` | ✅ | 发布文章 |
| 8 | PUT | `/api/posts/:id` | ✅ | 编辑文章 |
| 9 | DELETE | `/api/posts/:id` | ✅ | 删除文章 |
| 10 | GET | `/api/my/posts` | ✅ | 我的文章 |
| 11 | GET | `/api/categories` | ❌ | 分类列表 |
