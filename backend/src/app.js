/**
 * 顶呱呱AI宝 - 后端服务入口
 * Node.js + Express + MongoDB + Redis
 */

require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

// 工具函数
const logger = require('./utils/logger')
const { connectRedis } = require('./utils/redis')

// 路由
const authRoutes = require('./routes/auth')
const chatRoutes = require('./routes/chat')
const aiRoutes = require('./routes/ai')
const reportRoutes = require('./routes/report')
const subscriptionRoutes = require('./routes/subscription')
const achievementRoutes = require('./routes/achievement')
const taskRoutes = require('./routes/task')

// 中间件
const { errorHandler } = require('./middleware/errorHandler')
const { rateLimiter } = require('./middleware/rateLimiter')
const authMiddleware = require('./middleware/auth')

// 创建Express应用
const app = express()
const server = http.createServer(app)

// Socket.io 配置
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// ========== 中间件配置 ==========

// 安全头
app.use(helmet())

// 压缩
app.use(compression())

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}))

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

// Body解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Cookie解析
app.use(cookieParser())

// ========== Socket.io 路由 ==========
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`)

  // 加入会话房间
  socket.on('join_session', ({ sessionId }) => {
    socket.join(sessionId)
    logger.info(`Socket ${socket.id} joined session ${sessionId}`)
  })

  // 离开会话
  socket.on('leave_session', ({ sessionId }) => {
    socket.leave(sessionId)
  })

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`)
  })
})

// 将io传递给路由
app.set('io', io)

// ========== API 路由 ==========

// 公开路由
app.use('/api/auth', authRoutes)
app.use('/api/subscription', subscriptionRoutes)

// 需要鉴权的路由
app.use('/api/chat', authMiddleware, chatRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/report', authMiddleware, reportRoutes)
app.use('/api/achievement', authMiddleware, achievementRoutes)
app.use('/api/task', authMiddleware, taskRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  })
})

// 错误处理
app.use(errorHandler)

// ========== 数据库连接 ==========

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('✅ MongoDB connected successfully')
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

async function startServer() {
  // 连接数据库
  await connectDatabase()

  // 连接Redis
  await connectRedis()

  // 启动服务器
  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`)
    logger.info(`📱 Environment: ${process.env.NODE_ENV}`)
  })
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    mongoose.connection.close()
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    mongoose.connection.close()
    process.exit(0)
  })
})

// 启动
startServer().catch((err) => {
  logger.error('Server startup failed:', err)
  process.exit(1)
})

module.exports = { app, server, io }
