/**
 * 统一错误处理中间件
 */

const logger = require('../utils/logger')

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body
  })

  // Joi验证错误
  if (err.isJoi) {
    return res.status(400).json({
      code: 400,
      message: err.details[0].message,
      data: null
    })
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: 'Token无效',
      data: null
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: 'Token已过期',
      data: null
    })
  }

  // MongoDB错误
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        code: 409,
        message: '数据已存在',
        data: null
      })
    }
  }

  // 默认错误
  const statusCode = err.statusCode || 500
  const message = err.expose ? err.message : '服务器内部错误'

  res.status(statusCode).json({
    code: statusCode,
    message,
    data: null
  })
}

/**
 * 404错误
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    code: 404,
    message: '资源不存在',
    data: null
  })
}

module.exports = {
  errorHandler,
  notFoundHandler
}
