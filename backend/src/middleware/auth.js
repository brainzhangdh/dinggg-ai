/**
 * JWT认证中间件
 */

const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

/**
 * 验证JWT Token
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证Token',
        data: null
      })
    }

    const token = authHeader.substring(7)

    // 验证Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 将用户信息挂载到req对象
    req.user = {
      id: decoded.userId,
      openid: decoded.openid,
      role: decoded.role
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token已过期，请重新登录',
        data: null
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'Token无效',
        data: null
      })
    }

    logger.error('Auth middleware error:', error)
    return res.status(500).json({
      code: 500,
      message: '认证失败',
      data: null
    })
  }
}

/**
 * 可选认证中间件（不强制登录）
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: decoded.userId,
      openid: decoded.openid,
      role: decoded.role
    }
  } catch (error) {
    // 忽略错误，继续处理
  }

  next()
}

/**
 * 角色检查中间件
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '请先登录',
        data: null
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null
      })
    }

    next()
  }
}

module.exports = authMiddleware
module.exports.optionalAuth = optionalAuth
module.exports.requireRole = requireRole
