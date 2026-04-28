# EchoBlog

✍️ 简洁优雅的个人博客系统，基于 Go + Gin 构建，支持文章发布、分类管理与个人资料展示。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Go 1.26 / Gin / GORM |
| 数据库 | MySQL |
| 缓存 | Redis |
| 认证 | JWT |
| 前端 | Vanilla JS（原生，无框架） |

## 功能特性

- **用户系统**：注册 / 登录 / 个人资料编辑（昵称、头像、封面、简介、位置、社交链接）
- **文章管理**：发布 / 编辑 / 删除 / 查看，封面图上传（本地存储）
- **分类体系**：多分类管理，文章按分类筛选
- **认证保护**：JWT 中间件，登录状态持久化
- **前台展示**：文章列表（分页 + 搜索）、分类侧边栏、博客统计
- **响应式设计**：适配桌面端，现代化 UI

## 项目结构

```
EchoBlog/
├── main.go                 # 程序入口
├── config/
│   └── config.go           # Viper 配置加载（支持 config.yaml）
├── db/
│   └── db.go               # MySQL + GORM 初始化
├── pkg/
│   └── redis/              # Redis 连接封装
├── routers/
│   └── router.go           # Gin 路由定义
├── internal/
│   ├── model/              # 数据模型（User、Post、Category、Tag）
│   ├── repository/         # 数据访问层
│   ├── service/             # 业务逻辑层
│   ├── handler/            # HTTP 处理器
│   └── middleware/         # JWT 中间件
└── web/
    ├── index.html          # 单页应用入口
    ├── css/style.css       # 全局样式
    └── js/
        ├── api.js          # API 请求封装
        ├── utils.js        # 工具函数
        ├── app.js          # SPA 路由 & 认证状态
        ├── page-home.js    # 首页
        ├── page-post.js    # 文章详情
        ├── page-auth.js    # 登录 / 注册
        ├── page-my-posts.js # 我的文章
        └── page-profile.js # 个人中心
```

## 📄 项目文档

详细的技术方案和 API 接口说明请查阅 docs 目录：

- 📘 [技术方案文档](./docs/技术方案文档.md)
- 📗 [API 接口文档](./docs/API接口文档.md)

## 本地运行

### 1. 配置数据库

创建 `config/config.yaml`（可选，不存在时使用默认配置）：

```yaml
mysql:
  host:     127.0.0.1
  port:     3306
  user:     root
  password: 123456
  dbname:   echoblog

redis:
  addr:     localhost:6379
  password: 123456
  db:       0

jwt:
  secret: "your-secret-key"
  expire: 24  # 小时
```

### 2. 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS echoblog DEFAULT CHARACTER SET utf8mb4;
```

### 3. 启动服务

```bash
go mod tidy
go run main.go
```

访问 → http://localhost:8080/web

## 部署

```bash
# Linux/macOS
go build -o echoblog main.go
./echoblog
```

部署到阿里云 ECS 时，将编译好的二进制与 `web/` 目录、`config/` 目录一起上传即可。

## License

MIT
