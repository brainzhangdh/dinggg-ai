/**
 * 接口限流中间件
 */

const rateLimit = require('express-rate-limit')
const logger = require('../utils/logger')

/**
 * 通用限流器
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id
    })
    res.status(429).json(options.message)
  }
})

/**
 * 登录限流器（更严格）
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试',
    data: null
  }
})

/**
 * 消息限流器（AI对话接口）
 */
const messageLimiter = rateLimit({
  windowMs: 60000, // 1分钟
  max: 30, // 最多30次/分钟
  message: {
    code: 429,
    message: '请求过于频繁',
    data: null
  }
})

module.exports = {
  rateLimiter: generalLimiter,
  loginLimiter,
  messageLimiter
}
