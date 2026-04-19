# 顶呱呱AI宝 - 自动化测试流程

## 测试环境
- H5地址: http://162.14.75.65/
- API地址: http://162.14.75.65/api
- 服务器: 162.14.75.65

## 测试Skills
- `skills/e2e-testing-patterns/` - E2E测试模式
- `skills/openclaw-api-tester/` - API测试

## API端点清单

### 公开接口
- POST /api/auth/register/parent - 注册
- POST /api/auth/login - 登录
- GET  /api/chat/scenes - 场景列表（需要Token）
- GET  /api/task/daily - 每日任务（需要Token）
- GET  /api/achievement/list - 成就列表（需要Token）

### 需要认证的接口
- GET  /api/auth/profile - 用户资料
- GET  /api/chat/scenes/:id - 场景详情
- POST /api/chat/session - 创建对话
- GET  /api/task/daily/:id/complete - 完成任务

## 自动化测试命令

### 1. API测试
```bash
# 测试公开接口
curl -X POST http://162.14.75.65/api/auth/register/parent \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_001","nickname":"测试用户"}'

# 测试需要认证的接口（需要先登录获取token）
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" http://162.14.75.65/api/chat/scenes
```

### 2. 前端UI测试
- 使用Playwright或Puppeteer进行E2E测试
- 测试每个页面加载、按钮点击、表单提交

### 3. 完整测试流程
```bash
# 完整测试脚本
#!/bin/bash
echo "=== 顶呱呱AI宝自动化测试 ==="

# 1. 后端健康检查
echo "[1/5] 测试后端API..."
curl -s http://162.14.75.65/api/chat/scenes | grep -q "code" && echo "✅ API正常" || echo "❌ API异常"

# 2. 前端访问检查
echo "[2/5] 测试前端页面..."
curl -s http://162.14.75.65/ | grep -q "顶呱呱" && echo "✅ 前端正常" || echo "❌ 前端异常"

# 3. 数据库连接
echo "[3/5] 测试数据库..."
# 通过API间接测试

# 4. Redis连接
echo "[4/5] 测试Redis..."
# 通过API间接测试

# 5. 整体报告
echo "[5/5] 生成报告..."
echo "测试完成"
```

## CI/CD测试循环

```
代码提交 → GitHub Actions CI
  ↓
1. 单元测试
2. 构建测试
3. 部署到测试环境
4. E2E自动化测试
  ↓
通过 → 部署到生产
失败 → 通知开发修复
```

## 报告输出
- 测试结果保存到: `/home/brain/.openclaw/workspace-dinggg/test-reports/`
- 格式: HTML + JSON
