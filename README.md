# 梦幻旅行记忆馆 (Oyster Park)

一款基于 Vue 3 + Three.js 的手绘卡通地球旅行记忆展示网站，配有 Node.js + Express + SQLite 后端，支持用户注册登录、城市管理、照片上传、旅行手账编辑。

---

## 项目结构

```
oyster-park/
├── src/                          # 前端源码（Vue 3 + Three.js）
│   ├── api/                      # API 请求封装（axios）
│   ├── components/               # Vue 组件
│   │   ├── EarthGlobe.vue        # Three.js 3D 地球（主视觉）
│   │   ├── MemoryCard.vue        # 城市记忆卡片（右侧弹出）
│   │   ├── PhotoStack.vue        # 照片墙
│   │   ├── JournalNote.vue       # 旅行手账（可编辑）
│   │   ├── MemoryTimeline.vue    # 时间胶囊（旅行时间轴）
│   │   ├── PhotoUploader.vue     # 照片上传组件
│   │   ├── CityEditor.vue        # 新增城市面板
│   │   ├── LoginModal.vue        # 登录注册弹窗
│   │   ├── DreamParkLoader.vue   # 开场加载页
│   │   ├── DreamParticles.vue    # 梦幻粒子动画
│   │   └── FloatingDecorations.vue # 漂浮装饰元素
│   ├── pages/
│   │   └── HomePage.vue          # 首页（集成登录条、新增城市按钮）
│   ├── stores/
│   │   └── memory.js             # Pinia 状态管理（含 API 方法）
│   ├── utils/
│   │   └── CameraController.js   # Three.js 相机控制器
│   ├── assets/photo/             # 预设示例照片
│   ├── App.vue
│   └── main.js
├── backend/                      # 后端源码（Node.js + Express）
│   ├── src/
│   │   ├── index.js              # Express 入口
│   │   ├── config/
│   │   │   ├── db.js             # SQLite 数据库封装（兼容 $1 占位符）
│   │   │   └── init.sql          # 数据库建表 SQL
│   │   ├── controllers/
│   │   │   ├── authController.js    # 注册/登录
│   │   │   ├── cityController.js    # 城市 CRUD
│   │   │   ├── photoController.js   # 照片上传/删除
│   │   │   └── journalController.js # 手账 CRUD
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT 鉴权中间件
│   │   │   └── upload.js         # multer + sharp 上传处理
│   │   ├── models/
│   │   │   └── init.js           # 数据库初始化脚本
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── cities.js
│   │       ├── photos.js
│   │       └── journals.js
│   ├── uploads/                  # 用户上传图片存储目录
│   ├── .env.example              # 环境变量示例（复制为 .env 使用）
│   └── package.json
├── vite.config.js                # Vite 配置（含 API 代理）
├── start.bat / start.ps1         # 一键启动脚本
├── backup.bat / backup.ps1       # 一键备份脚本
├── package.json
└── README.md
```

---

## 安装与运行

### 0. 一键启动（推荐）

双击根目录的 `start.bat` 即可：

- 首次运行会自动安装前后端依赖
- 自动启动后端（3001）和前端（5173）两个窗口，就绪后自动打开浏览器
- 关掉两个窗口即停止；服务已在运行时不会重复启动，直接打开页面

### 环境要求

- Node.js >= 18
- Node.js >= 22（推荐，`node --watch-path` 需要）
- npm

### 1. 数据库准备

项目使用 **SQLite**，不需要安装任何数据库软件，也无需配置连接串。

- 数据文件：`backend/dream_travel.db`（首次启动后端时自动创建，无需手动建库）
- 如需手动初始化表结构，可在项目根目录执行：

```bash
cd backend
node src/models/init.js
```

### 2. 配置环境变量

`backend/.env` 是可选的，所有配置都有默认值。示例：

```env
PORT=3001
JWT_SECRET=oyster-park-dream-travel-jwt-secret-2024
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### 3. 安装依赖

```bash
# 安装前端依赖（项目根目录）
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 4. 启动服务

你需要同时启动前端和后端两个服务：

**终端 1 - 启动后端：**

```bash
cd backend
npm run dev
```

后端运行在 http://localhost:3001

> `npm run dev` 使用普通 `node` 启动，稳定可靠（改后端代码后手动重启即可）。
> 如需热重载可改用 `npm run dev:watch`（只监听 `src`，不会因数据库写入自动重启）；
> 注意 Windows 上 `node --watch` 重启时偶发端口竞态（`EADDRINUSE`），
> 遇到时把占用 3001 端口的旧进程结束掉再启动即可。

**终端 2 - 启动前端：**

```bash
# 项目根目录
npm run dev
```

前端运行在 http://localhost:5173

### 5. 使用

1. 浏览器打开 http://localhost:5173
. <img width="2829" height="1530" alt="屏幕截图 2026-08-14 112645" src="https://github.com/user-attachments/assets/4cf6e928-31ab-4f00-ba73-947d314bfc4f" />

2. 点击右上角的 **登录** 按钮，先 **去注册** 创建一个账号
 <img width="2786" height="1548" alt="屏幕截图 2026-08-14 112706" src="https://github.com/user-attachments/assets/c2b90b76-6d58-495a-857c-7d15ab0be10e" />
3. 注册成功后自动登录，地球上的城市会从后端加载
   <img width="2707" height="1548" alt="屏幕截图 2026-08-14 112624" src="https://github.com/user-attachments/assets/778e6ec1-8764-463f-989e-b8c08af98e35" />
4. 点击 **新增城市** 按钮添加旅行目的地（填写城市名、经纬度、旅行时间）
5. 点击地球上的城市光点，打开记忆卡片
 <img width="983" height="1431" alt="屏幕截图 2026-08-14 112754" src="https://github.com/user-attachments/assets/abee842a-85d1-44ef-b552-2bcd24dbbaaa" />
6. 在卡片中点击 **上传照片** 区域选择图片（支持拖拽）
7. 点击 **旅行手账** 进入编辑模式，记录旅行故事

---

## 项目部署到云服务器

### 前端部署（Vercel / Netlify）

1. 在 Vercel 上导入项目，框架选择 Vite
2. 设置环境变量（可选）
3. 构建命令：`npm run build`
4. 输出目录：`dist`

### 后端部署（阿里云 / 腾讯云 / 其他 VPS）

```bash
# 服务器上安装 Node.js

# 拉取代码
git clone <你的仓库地址> /var/www/oyster-park
cd /var/www/oyster-park

# 安装依赖
npm install
cd backend && npm install && cd ..

# 配置环境变量（可选，默认即可运行；SQLite 无需数据库连接串）
# 编辑 backend/.env，按需修改 PORT / JWT_SECRET 等

# 使用 pm2 启动后端
npm install -g pm2
pm2 start backend/src/index.js --name dream-travel-api

# 构建前端
npm run build
```

### Nginx 配置（统一域名访问）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/oyster-park/dist;
    index index.html;

    # SPA 路由 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

---

## API 接口文档

### 认证

| 方法   | 路径               | 说明     | 需要登录 |
|--------|--------------------|----------|----------|
| POST   | /api/auth/register | 注册     | 否       |
| POST   | /api/auth/login    | 登录     | 否       |
| GET    | /api/auth/me       | 获取用户 | 是       |

### 城市

| 方法   | 路径            | 说明         | 需要登录 |
|--------|-----------------|--------------|----------|
| GET    | /api/cities     | 获取所有城市 | 是       |
| POST   | /api/cities     | 新增城市     | 是       |
| PUT    | /api/cities/:id | 更新城市     | 是       |
| DELETE | /api/cities/:id | 删除城市     | 是       |

### 照片

| 方法   | 路径                      | 说明             | 需要登录 |
|--------|---------------------------|------------------|----------|
| POST   | /api/photos/upload        | 上传照片（批量） | 是       |
| GET    | /api/photos/city/:cityId  | 获取城市照片     | 是       |
| DELETE | /api/photos/:id           | 删除照片         | 是       |

### 手账

| 方法   | 路径                     | 说明         | 需要登录 |
|--------|--------------------------|--------------|----------|
| GET    | /api/journals/:cityId    | 获取手账     | 是       |
| PUT    | /api/journals/:cityId    | 新增/更新    | 是       |
| DELETE | /api/journals/:cityId    | 删除手账     | 是       |

---

## 技术栈

- **前端**: Vue 3 (Composition API) + Pinia + Three.js + GSAP + Vite
- **后端**: Node.js + Express + SQLite（better-sqlite3）+ JWT
- **图片处理**: multer + sharp（自动压缩、格式校验）
- **认证**: bcryptjs + jsonwebtoken
