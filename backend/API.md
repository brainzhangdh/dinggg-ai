# 顶呱呱AI宝 - 后端API文档

> 版本：v1.0.0 | 更新时间：2026-04-19

---

## 📌 概述

### 接口地址
```
生产环境：https://api.dinggg.com
开发环境：http://localhost:3000
```

### 认证方式
- **JWT Token**：除公开接口外，所有接口需在 Header 中携带 Token
- 格式：`Authorization: Bearer <token>`

### 统一响应格式
```json
{
  "code": 0,        // 状态码，0=成功，非0=失败
  "message": "success", // 消息
  "data": {}        // 数据体
}
```

### 错误码
| code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录/Token无效 |
| 403 | 权限不足/配额用完 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

---

## 🔐 认证模块 `/api/auth`

### 微信登录
```
POST /api/auth/login
```

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | ✅ | 微信授权code |

**响应示例：**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "nickname": "小小英语家",
      "avatar": "",
      "age": 10,
      "role": "child",
      "subscription": {
        "plan": "free",
        "startDate": null,
        "endDate": null,
        "autoRenew": false
      },
      "stats": {
        "totalSessions": 0,
        "totalMinutes": 0,
        "totalStars": 0,
        "streakDays": 0,
        "lastPracticeDate": null
      }
    }
  }
}
```

---

### 刷新Token
```
POST /api/auth/refresh
```

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | string | ✅ | 刷新Token |

**响应示例：**
```json
{
  "code": 0,
  "message": "刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 获取用户资料
```
GET /api/auth/profile
```
**需要登录**

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "openid": "oABC123...",
    "nickname": "小小英语家",
    "avatar": "",
    "age": 10,
    "role": "child",
    "parentId": null,
    "parentCode": null,
    "subscription": {...},
    "stats": {...},
    "createdAt": "2026-04-19T00:00:00.000Z",
    "updatedAt": "2026-04-19T00:00:00.000Z"
  }
}
```

---

### 更新用户资料
```
PUT /api/auth/profile
```
**需要登录**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | ❌ | 昵称 |
| avatar | string | ❌ | 头像URL |
| age | number | ❌ | 年龄（6-18） |

---

### 生成家长绑定码
```
POST /api/auth/parent-code
```
**需要登录**

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "code": "ABC123"
  }
}
```

---

### 绑定家长
```
POST /api/auth/bind-parent
```
**需要登录（孩子账号）**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parentCode | string | ✅ | 家长码（6位） |

---

## 💬 对话模块 `/api/chat`

### 获取场景列表
```
GET /api/chat/scenes
```
**公开接口**

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| free | boolean | ❌ | 只返回免费场景 |

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "code": "daily_greeting",
      "name": "日常打招呼",
      "nameEn": "Daily Greeting",
      "description": "练习简单的日常问候用语",
      "ageRange": { "min": 6, "max": 12 },
      "icon": "👋",
      "isFree": true,
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

---

### 获取场景详情
```
GET /api/chat/scenes/:id
```
**公开接口**

---

### 创建对话会话
```
POST /api/chat/session
```
**需要登录**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sceneId | string | ✅ | 场景ID |

**响应示例：**
```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "sessionId": "65f1a2b3c4d5e6f7a8b9c0d3",
    "sceneName": "日常打招呼",
    "initialMessage": "Hello! I'm DingDong! 👋 What's your name?"
  }
}
```

---

### 获取会话历史
```
GET /api/chat/session/:id
```
**需要登录**

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
      "sceneId": {...},
      "status": "active",
      "messageCount": 5
    },
    "messages": [
      {
        "_id": "...",
        "role": "user",
        "type": "text",
        "userText": "Hello!"
      },
      {
        "_id": "...",
        "role": "assistant",
        "aiText": "Hi there! Great job! 🎉"
      }
    ]
  }
}
```

---

### 发送消息（核心接口）
```
POST /api/chat/message
```
**需要登录** | **限流：30次/分钟**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | ❌ | 会话ID（新会话可空） |
| sceneId | string | ❌ | 场景ID（创建新会话时必填） |
| type | string | ✅ | `voice` 或 `text` |
| text | string | ❌ | 文本内容（type=text时必填） |
| audioBase64 | string | ❌ | 语音Base64（type=voice时必填） |

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "messageId": "65f1a2b3c4d5e6f7a8b9c0d4",
    "text": "That's great! Tell me more about your school! 🏫",
    "audioUrl": "https://cdn.dinggg.com/audio/xxx.mp3",
    "correction": {
      "hasError": true,
      "originalPhrase": "I have the recess",
      "correctedPhrase": "I have recess",
      "tip": "We usually say 'have recess' without 'the'."
    },
    "starsEarned": 1,
    "sessionId": "65f1a2b3c4d5e6f7a8b9c0d3"
  }
}
```

---

### 结束对话会话
```
DELETE /api/chat/session/:id
```
**需要登录**

**响应示例：**
```json
{
  "code": 0,
  "message": "会话已结束",
  "data": {
    "duration": 300,
    "messageCount": 10,
    "starsEarned": 12
  }
}
```

---

## 🤖 AI能力模块 `/api/ai`

### 语音识别(ASR)
```
POST /api/ai/asr
```
**需要登录**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audioBase64 | string | ✅ | 音频Base64 |
| language | string | ❌ | 语言boost，默认`en` |

---

### 对话生成(LLM)
```
POST /api/ai/llm
```
**需要登录**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | array | ✅ | 消息数组 |
| systemPrompt | string | ❌ | 系统提示词 |
| temperature | number | ❌ | 温度参数（0-1） |
| maxTokens | number | ❌ | 最大token数 |

---

### 语音合成(TTS)
```
POST /api/ai/tts
```
**需要登录**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | ✅ | 文本内容 |
| voiceId | string | ❌ | 音色ID |
| speed | number | ❌ | 语速（默认0.85） |

---

### 查询TTS任务状态
```
GET /api/ai/tts/:taskId
```
**需要登录**

---

## 📊 学习报告模块 `/api/report`

### 获取今日学习报告
```
GET /api/report/daily
```
**需要登录**

### 获取本周学习报告
```
GET /api/report/weekly
```
**需要登录**

### 获取总体学习报告
```
GET /api/report/summary
```
**需要登录（家长端）**

### 获取单次对话详情报告
```
GET /api/report/detail/:sessionId
```
**需要登录**

---

## 🏆 成就与任务模块

### 获取成就列表
```
GET /api/achievement/list
```
**需要登录**

### 获取徽章墙
```
GET /api/achievement/badges
```
**需要登录**

### 获取今日任务
```
GET /api/task/daily
```
**需要登录**

### 完成任务
```
POST /api/task/daily/:id/complete
```
**需要登录**

---

## 💳 订阅支付模块 `/api/subscription`

### 获取会员方案列表
```
GET /api/subscription/plans
```
**公开接口**

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "free",
      "name": "免费版",
      "price": 0,
      "features": ["每日3次对话", "有广告干扰", "基础学习报告"]
    },
    {
      "id": "monthly",
      "name": "月度会员",
      "price": 29,
      "period": "月",
      "originalPrice": 39,
      "features": ["无限对话", "无广告干扰", "详细学习报告", "优先体验新功能"]
    },
    {
      "id": "yearly",
      "name": "年度会员",
      "price": 199,
      "period": "年",
      "originalPrice": 299,
      "recommended": true,
      "features": ["无限对话", "无广告干扰", "专属年度总结报告", "优先体验新功能", "专属勋章"]
    }
  ]
}
```

---

### 获取会员状态
```
GET /api/subscription/status
```
**需要登录**

---

### 创建支付订单
```
POST /api/subscription/create-order
```
**需要登录**

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planId | string | ✅ | `monthly` 或 `yearly` |

**响应示例：**
```json
{
  "code": 0,
  "message": "订单创建成功",
  "data": {
    "orderId": "ORDER_1713500000000_65f1a2b3...",
    "prepayId": "wx2017040156a8b9c0d2",
    "paymentParams": {
      "appId": "wx...",
      "timeStamp": "1713500000",
      "nonceStr": "abc123...",
      "package": "prepay_id=wx2017040156a8b9c0d2",
      "signType": "MD5",
      "paySign": "..."
    }
  }
}
```

---

### 微信支付回调
```
POST /api/subscription/wx-callback
```
**微信支付服务器回调，无需登录**

---

### 取消自动续费
```
POST /api/subscription/cancel
```
**需要登录**

---

## 🔌 WebSocket 实时通信

### 连接
```
// 客户端连接
const socket = io('https://api.dinggg.com', {
  auth: { token: 'Bearer <token>' }
})
```

### 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `join_session` | Client→Server | 加入对话房间 `{ sessionId }` |
| `leave_session` | Client→Server | 离开对话房间 `{ sessionId }` |
| `ai_stream` | Server→Client | AI回复流式输出 |
| `ai_complete` | Server→Client | AI回复完成 |
| `error` | Server→Client | 错误通知 |

### ai_stream 事件数据格式
```json
{
  "messageId": "65f1a2b3...",
  "text": "Great job! 🎉",
  "audioUrl": "https://cdn.dinggg.com/audio/xxx.mp3",
  "correction": {
    "hasError": false
  },
  "starsEarned": 1
}
```

---

## 📋 数据模型

### User 用户表
```javascript
{
  _id: ObjectId,
  openid: String,           // 微信openid（唯一）
  unionid: String,          // 微信unionid
  nickname: String,         // 昵称
  avatar: String,           // 头像URL
  age: Number,              // 年龄（6-18）
  role: "child" | "parent", // 角色
  parentId: ObjectId,        // 关联家长ID
  parentCode: String,       // 家长绑定码（6位）
  subscription: {
    plan: "free" | "monthly" | "yearly",
    startDate: Date,
    endDate: Date,
    autoRenew: Boolean
  },
  stats: {
    totalSessions: Number,
    totalMinutes: Number,
    totalStars: Number,
    streakDays: Number,
    lastPracticeDate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Session 会话表
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // 用户ID
  sceneId: ObjectId,        // 场景ID
  status: "active" | "completed",
  startTime: Date,
  endTime: Date,
  duration: Number,        // 持续时长（秒）
  messageCount: Number,     // 消息轮数
  starsEarned: Number,      // 本次获得星星
  rating: Number,          // 满意度(1-5)
  createdAt: Date
}
```

### Message 消息表
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  role: "user" | "assistant",
  type: "voice" | "text",
  userText: String,        // 用户说的文字
  userAudioUrl: String,    // 用户语音URL
  aiText: String,          // AI回复文字
  aiAudioUrl: String,      // AI语音URL
  correction: {
    hasError: Boolean,
    originalText: String,
    correctedText: String,
    tip: String
  },
  starsEarned: Number,
  createdAt: Date
}
```

### Scene 场景表
```javascript
{
  _id: ObjectId,
  code: String,            // 场景代码
  name: String,            // 场景名称
  nameEn: String,          // 英文名
  description: String,
  ageRange: { min: Number, max: Number },
  icon: String,
  systemPrompt: String,    // AI系统提示词
  initialMessage: String,  // AI开场白
  isFree: Boolean,         // 是否免费
  sortOrder: Number,
  isActive: Boolean
}
```

### Report 学习报告表
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: String,           // "YYYY-MM-DD"
  summary: {
    sessionsCount: Number,
    totalMinutes: Number,
    totalMessages: Number,
    scenes: [String],
    averageRating: Number
  },
  improvement: {
    vsYesterday: Number,
    vsLastWeek: Number
  },
  highlights: [String],
  suggestions: [String]
}
```

---

## 🚀 部署说明

### 环境变量
```bash
# Node
NODE_ENV=production
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/dinggg

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# 微信支付
WECHAT_APPID=wx...
WECHAT_SECRET=...
WECHAT_MCH_ID=...
WECHAT_API_KEY=...
WECHAT_NOTIFY_URL=https://yourdomain.com/api/subscription/wx-callback

# MiniMax AI
MINIMAX_API_KEY=...
MINIMAX_GROUP_ID=...
MINIMAX_BASE_URL=https://api.minimax.chat

# 前端地址
FRONTEND_URL=https://yourdomain.com

# 限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 免费用户配额
FREE_USER_DAILY_QUOTA=3
```

### 启动命令
```bash
# 安装依赖
npm install

# 初始化数据库（首次部署）
node scripts/initDb.js

# 生产环境
npm start

# 开发环境
npm run dev
```

### Nginx 配置
```nginx
server {
    listen 443 ssl;
    server_name api.dinggg.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
