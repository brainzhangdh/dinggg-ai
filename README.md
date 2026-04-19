# 顶呱呱AI宝 (DingGG AI Tutor)

> 让6-18岁孩子爱上说英语 📣

微信小程序 + AI口语陪练，帮助孩子告别"哑巴英语"。

## 🌟 产品亮点

- **AI情景对话** — 7大场景，专业外教陪你练
- **语音输入** — 一按就说，简单方便
- **即时纠正** — 温和鼓励式纠错，不打击孩子信心
- **趣味激励** — 星星/徽章/成就，爱上坚持练习
- **家长监控台** — 让付费的家长看得见效果

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | uni-app 4.x + Vue 3 + TypeScript + Pinia |
| 后端 | Node.js 20 + Express 4 + Socket.io |
| 数据库 | MongoDB 7 + Redis 7 |
| AI | MiniMax API (ASR + LLM + TTS) |
| 部署 | Docker + Nginx |

## 📁 项目结构

```
dinggg-ai/
├── frontend/          # uni-app 小程序前端
│   ├── src/
│   │   ├── pages/         # 页面
│   │   ├── components/    # 组件
│   │   ├── static/        # 静态资源
│   │   ├── store/         # Pinia状态
│   │   ├── utils/         # 工具函数
│   │   └── styles/        # 全局样式
│   ├── package.json
│   └── manifest.json
│
├── backend/           # Node.js 后端
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── models/        # Mongoose模型
│   │   ├── services/      # 业务逻辑
│   │   ├── middleware/    # 中间件
│   │   ├── ai/            # MiniMax AI对接
│   │   ├── config/        # 配置
│   │   └── utils/         # 工具函数
│   ├── package.json
│   └── .env.example
│
├── docker/             # Docker部署文件
└── nginx/              # Nginx配置
```

## 🚀 快速开始

### 前置环境

- Node.js 20+
- MongoDB 7+
- Redis 7+
- Docker (可选)

### 后端启动

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入必要的 API Key
npm install
npm run dev
```

### 前端启动

```bash
cd frontend
npm install
# 使用 HBuilderX 打开项目
# 或命令行：npm run dev:mp-weixin
```

### Docker 部署

```bash
cd docker
docker-compose up -d
```

## 📱 核心功能

### 孩子端
- [ ] 场景选择（日常打招呼、看动画、交朋友等）
- [ ] AI情景对话
- [ ] 语音输入/文字输入
- [ ] 即时纠正反馈
- [ ] 星星/徽章奖励
- [ ] 学习报告

### 家长端
- [ ] 家长绑定码
- [ ] 学习数据看板
- [ ] 会员订阅管理

## 📝 API 文档

详见 [API.md](./docs/API.md)

## 🤝 开发规范

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

MIT
