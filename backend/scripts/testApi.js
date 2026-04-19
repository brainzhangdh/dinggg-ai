/**
 * API冒烟测试脚本
 * 运行: node scripts/testApi.js
 *
 * 测试所有核心API接口，验证服务正常运行
 */

require('dotenv').config()
const axios = require('axios')

// 测试配置
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const TEST_USER_OPENID = `test_${Date.now()}`

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.blue}${msg}${colors.reset}\n`)
}

// 统计
let passed = 0
let failed = 0

// 创建测试用户（用于测试需要登录的接口）
let testUser = null
let authToken = null

/**
 * 测试辅助函数
 */
async function test(name, fn) {
  try {
    await fn()
    log.success(name)
    passed++
  } catch (err) {
    log.error(`${name}: ${err.message}`)
    failed++
  }
}

/**
 * 发送请求
 */
async function request(method, path, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  if (data) {
    config.data = data
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    if (err.response) {
      return err.response.data
    }
    throw err
  }
}

/**
 * 健康检查
 */
async function healthCheck() {
  log.section('🏥 健康检查')

  await test('GET /health - 服务是否运行', async () => {
    const res = await request('GET', '/health')
    if (!res.status && res.status !== 'ok') {
      throw new Error(`服务未正常运行: ${JSON.stringify(res)}`)
    }
  })
}

/**
 * 认证模块测试
 */
async function testAuth() {
  log.section('🔐 认证模块测试')

  await test('POST /api/auth/register - 注册新用户', async () => {
    const res = await request('POST', '/api/auth/register', {
      openid: TEST_USER_OPENID,
      nickname: '测试用户',
      age: 10,
      role: 'child'
    })

    if (res.code !== 0 && res.code !== undefined) {
      throw new Error(`注册失败: ${res.message}`)
    }

    testUser = res.data.user
    authToken = res.data.token
    log.info(`注册成功，用户ID: ${testUser?.id}`)
  })

  await test('POST /api/auth/login - 用户登录', async () => {
    const res = await request('POST', '/api/auth/login', {
      code: TEST_USER_OPENID // 使用openid模拟登录
    })

    if (res.code !== 0) {
      throw new Error(`登录失败: ${res.message}`)
    }

    authToken = res.data.token
    testUser = res.data.user
  })

  await test('GET /api/auth/profile - 获取用户资料', async () => {
    const res = await request('GET', '/api/auth/profile', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取资料失败: ${res.message}`)
    }
  })

  await test('PUT /api/auth/profile - 更新用户资料', async () => {
    const res = await request('PUT', '/api/auth/profile', {
      nickname: '小测试家'
    }, authToken)
    if (res.code !== 0) {
      throw new Error(`更新资料失败: ${res.message}`)
    }
  })

  await test('POST /api/auth/parent-code - 生成家长绑定码', async () => {
    const res = await request('POST', '/api/auth/parent-code', null, authToken)
    if (res.code !== 0) {
      throw new Error(`生成绑定码失败: ${res.message}`)
    }
    log.info(`家长绑定码: ${res.data.code}`)
  })
}

/**
 * 场景模块测试
 */
async function testScenes() {
  log.section('💬 场景模块测试')

  await test('GET /api/chat/scenes - 获取场景列表', async () => {
    const res = await request('GET', '/api/chat/scenes')
    if (res.code !== 0) {
      throw new Error(`获取场景列表失败: ${res.message}`)
    }
    if (!Array.isArray(res.data) || res.data.length === 0) {
      throw new Error('场景列表为空')
    }
    log.info(`获取到 ${res.data.length} 个场景`)
  })

  await test('GET /api/chat/scenes?free=true - 获取免费场景', async () => {
    const res = await request('GET', '/api/chat/scenes?free=true')
    if (res.code !== 0) {
      throw new Error(`获取免费场景失败: ${res.message}`)
    }
  })
}

/**
 * 成就模块测试
 */
async function testAchievement() {
  log.section('🏆 成就模块测试')

  await test('GET /api/achievement/list - 获取成就列表', async () => {
    const res = await request('GET', '/api/achievement/list', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取成就列表失败: ${res.message}`)
    }
    if (!Array.isArray(res.data)) {
      throw new Error('成就数据格式错误')
    }
    log.info(`获取到 ${res.data.length} 个成就`)
  })

  await test('GET /api/achievement/badges - 获取徽章墙', async () => {
    const res = await request('GET', '/api/achievement/badges', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取徽章墙失败: ${res.message}`)
    }
    log.info(`已获得: ${res.data.stats?.totalEarned || 0} 徽章`)
  })

  await test('GET /api/achievement/leaderboard - 获取排行榜', async () => {
    const res = await request('GET', '/api/achievement/leaderboard?limit=5', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取排行榜失败: ${res.message}`)
    }
    if (res.data?.leaderboard) {
      log.info(`排行榜共有 ${res.data.leaderboard.length} 名用户`)
    }
  })
}

/**
 * 任务模块测试
 */
async function testTask() {
  log.section('📋 任务模块测试')

  await test('GET /api/task/daily - 获取今日任务', async () => {
    const res = await request('GET', '/api/task/daily', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取任务失败: ${res.message}`)
    }
    if (!res.data?.tasks) {
      throw new Error('任务数据格式错误')
    }
    log.info(`今日任务: ${res.data.tasks.length} 个`)
  })
}

/**
 * 报告模块测试
 */
async function testReport() {
  log.section('📊 学习报告模块测试')

  await test('GET /api/report/daily - 获取今日报告', async () => {
    const res = await request('GET', '/api/report/daily', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取日报失败: ${res.message}`)
    }
    log.info(`今日学习: ${res.data?.summary?.totalMinutes || 0} 分钟`)
  })

  await test('GET /api/report/weekly - 获取本周报告', async () => {
    const res = await request('GET', '/api/report/weekly', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取周报失败: ${res.message}`)
    }
    if (res.data?.dailyData) {
      log.info(`本周 ${res.data.dailyData.length} 天有数据`)
    }
  })

  await test('GET /api/report/summary - 获取总体报告', async () => {
    const res = await request('GET', '/api/report/summary', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取总体报告失败: ${res.message}`)
    }
    log.info(`总学习时长: ${res.data?.stats?.totalMinutes || 0} 分钟`)
  })

  await test('GET /api/report/progress - 获取进步曲线', async () => {
    const res = await request('GET', '/api/report/progress?days=7', null, authToken)
    if (res.code !== 0) {
      throw new Error(`获取进步曲线失败: ${res.message}`)
    }
    log.info(`查询最近 ${res.data?.period?.days || 7} 天数据`)
  })
}

/**
 * 订阅模块测试
 */
async function testSubscription() {
  log.section('💳 订阅模块测试')

  await test('GET /api/subscription/plans - 获取会员方案', async () => {
    const res = await request('GET', '/api/subscription/plans')
    if (res.code !== 0) {
      throw new Error(`获取方案失败: ${res.message}`)
    }
    log.info(`获取到 ${res.data.length} 个订阅方案`)
  })

  await test('GET /api/subscription/status - 获取会员状态', async () => {
    const res = await request('GET', '/api/subscription/status', null, authToken)
    // 可能返回401（未订阅）或成功
    if (res.code !== 0 && res.code !== 401) {
      throw new Error(`获取状态失败: ${res.message}`)
    }
    log.info(`会员状态: ${res.data?.plan || 'free'}`)
  })
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('\n🚀 顶呱呱AI宝 - API冒烟测试')
  console.log(`📍 测试地址: ${BASE_URL}`)
  console.log(`⏰ 测试时间: ${new Date().toLocaleString('zh-CN')}`)

  try {
    // 先检查健康状态
    await healthCheck()

    // 执行各项测试
    await testAuth()
    await testScenes()
    await testAchievement()
    await testTask()
    await testReport()
    await testSubscription()

  } catch (err) {
    log.error(`测试异常: ${err.message}`)
    failed++
  }

  // 输出结果
  log.section('📊 测试结果汇总')
  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`📈 总计: ${passed + failed}`)

  if (failed === 0) {
    log.success('所有测试通过！🎉')
    process.exit(0)
  } else {
    log.error('部分测试失败，请检查接口实现')
    process.exit(1)
  }
}

// 运行测试
runTests()
