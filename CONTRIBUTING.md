# 开发规范 — 顶呱呱AI宝

## 1. Git 规范

### 1.1 分支命名

```
feature/{功能名}          # 新功能
fix/{问题描述}            # Bug修复
hotfix/{问题描述}         # 紧急修复
refactor/{模块名}         # 重构
docs/{类型}               # 文档更新
test/{测试类型}           # 测试相关
```

示例：
```bash
feature/voice-input
fix/session-timeout
hotfix/payment-callback
```

### 1.2 Commit 信息格式

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore
scope: auth | chat | ai | payment | report | ui
subject: 简短描述（中文，50字以内）
```

示例：
```
feat(chat): 新增语音输入功能
fix(ai): 修复TTS超时问题
docs: 更新API文档
```

### 1.3 PR 规范

- PR 标题：`[类型] 简短描述 #issue号`
- PR 描述必须包含：改动说明、测试情况、截图（如有UI改动）
- 至少1人Review通过后才能合并

---

## 2. 代码规范

### 2.1 JavaScript/TypeScript

- **前端**：ESLint + Prettier（HBuilderX已集成）
- **后端**：ESLint + Prettier
- 使用 `const` / `let`，禁止使用 `var`
- 异步操作使用 `async/await`，禁止回调地狱
- 接口命名使用 PascalCase（如 `UserService`）
- 函数命名使用 camelCase（如 `getUserInfo`）

### 2.2 Vue 3 组件规范

```vue
<!-- 1. 模板结构 -->
<template>
  <view class="component-name">
    <!-- 有意义的class命名 -->
    <view class="header">...</view>
  </view>
</template>

<!-- 2. 脚本：使用 Composition API + <script setup> -->
<script setup>
import { ref, computed, onMounted } from 'vue'

// Props 定义
const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})

// Emit 定义
const emit = defineEmits(['update', 'close'])

// 响应式数据
const count = ref(0)

// 计算属性
const doubled = computed(() => count.value * 2)

// 生命周期
onMounted(() => {
  // init
})

// 方法
function handleClick() {
  emit('update', doubled.value)
}
</script>

<!-- 3. 样式：使用 SCSS，添加 scoped -->
<style lang="scss" scoped>
.component-name {
  .header {
    font-size: 16px;
  }
}
</style>
```

### 2.3 API 响应格式

```javascript
// 成功
{
  "code": 0,
  "data": { ... },
  "message": "success"
}

// 失败
{
  "code": 错误码,
  "data": null,
  "message": "错误描述"
}
```

### 2.4 错误码规范

| 范围 | 模块 |
|------|------|
| 1000-1999 | 认证模块 |
| 2000-2999 | 对话模块 |
| 3000-3999 | AI模块 |
| 4000-4999 | 订阅支付 |
| 5000-5999 | 成就任务 |
| 9000-9999 | 系统错误 |

---

## 3. 数据库规范

### 3.1 MongoDB Collection 命名

- 使用小写 + 下划线（如 `user_sessions`）
- 单数形式（如 `user` 而不是 `users`）

### 3.2 Mongoose Schema

```javascript
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nickname: {
    type: String,
    default: '小小英语家'
  },
  role: {
    type: String,
    enum: ['child', 'parent'],
    default: 'child'
  }
}, {
  timestamps: true  // 自动添加 createdAt/updatedAt
})

module.exports = mongoose.model('User', UserSchema)
```

---

## 4. 接口规范

### 4.1 RESTful 风格

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/chat/sessions | 获取会话列表 |
| POST | /api/chat/session | 创建会话 |
| GET | /api/chat/session/:id | 获取会话详情 |
| DELETE | /api/chat/session/:id | 删除会话 |

### 4.2 请求头要求

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-Platform: miniprogram | h5 | app
```

### 4.3 接口文档

使用 JSDoc 注释所有接口：

```javascript
/**
 * 创建对话会话
 * @route POST /api/chat/session
 * @param {string} sceneId - 场景ID
 * @param {string} [deviceInfo] - 设备信息
 * @returns {Object} session - 会话对象
 */
```

---

## 5. 安全规范

### 5.1 敏感信息

- **禁止**在前端代码中硬编码任何 API Key
- 所有后端接口必须通过 `.env` 文件配置
- 微信 AppSecret 只能存放在后端服务端

### 5.2 JWT Token

- Access Token 有效期：2小时
- Refresh Token 有效期：7天
- Token 必须存放在 httpOnly cookie 或加密存储

### 5.3 用户输入

- 所有用户输入必须经过校验（Joi/Zod）
- SQL注入、XSS攻击防护
- 语音数据Base64传输必须校验大小限制（< 10MB）

---

## 6. 日志规范

### 6.1 日志级别

```javascript
logger.error('系统错误', { err, stack })
logger.warn('警告信息', { context })
logger.info('操作日志', { userId, action })
logger.debug('调试信息', { data })  // 仅开发环境
```

### 6.2 日志内容要求

- 必须包含：`timestamp`, `level`, `message`
- 必须包含：`requestId`（追踪请求链路）
- 敏感信息脱敏处理

---

## 7. 测试规范

### 7.1 单元测试

- 使用 Jest
- 覆盖率要求：核心业务 > 80%

### 7.2 接口测试

- 使用 Jest + Supertest
- 测试文件命名：`*.test.js`

---

## 8. 环境配置

| 环境 | 用途 | 数据库 |
|------|------|--------|
| development | 本地开发 | localhost |
| test | 单元测试 | 测试数据库 |
| staging | 预发布 | staging数据库 |
| production | 正式生产 | 线上数据库 |

---

## 9. 审核要点

提交代码前自检：

- [ ] 代码格式化（Prettier）
- [ ] ESLint 检查通过
- [ ] 有新增功能是否更新文档
- [ ] 敏感信息是否泄漏
- [ ] 单元测试是否通过
- [ ] 接口文档是否同步更新
