/**
 * 认证路由
 */

const express = require('express')
const router = express.Router()
const axios = require('axios')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const logger = require('../utils/logger')
const { loginLimiter } = require('../middleware/rateLimiter')

/**
 * 微信登录
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '缺少code参数',
        data: null
      })
    }

    // 微信code2Session
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const { openid, unionid, errcode, errmsg } = wxResponse.data

    if (errcode) {
      logger.error('WeChat API error:', { errcode, errmsg })
      return res.status(400).json({
        code: 400,
        message: '微信登录失败',
        data: null
      })
    }

    // 查找或创建用户
    let user = await User.findOne({ openid })

    if (!user) {
      user = await User.create({
        openid,
        unionid: unionid || undefined
      })
      logger.info('New user registered:', { openid, userId: user._id })
    }

    // 生成JWT
    const token = jwt.sign(
      {
        userId: user._id,
        openid: user.openid,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    )

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    )

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          subscription: user.subscription,
          stats: user.stats
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 刷新Token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        message: '缺少refreshToken',
        data: null
      })
    }

    // 验证refreshToken
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      })
    }

    // 生成新Token
    const token = jwt.sign(
      {
        userId: user._id,
        openid: user.openid,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    )

    res.json({
      code: 0,
      message: '刷新成功',
      data: { token }
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'refreshToken无效或已过期',
        data: null
      })
    }
    next(error)
  }
})

/**
 * 获取用户资料
 * GET /api/auth/profile
 */
router.get('/profile', require('../middleware/auth'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-__v')

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      })
    }

    res.json({
      code: 0,
      message: 'success',
      data: user
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 更新用户资料
 * PUT /api/auth/profile
 */
router.put('/profile', require('../middleware/auth'), async (req, res, next) => {
  try {
    const { nickname, avatar, age } = req.body
    const updates = {}

    if (nickname) updates.nickname = nickname
    if (avatar) updates.avatar = avatar
    if (age !== undefined) updates.age = age

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    )

    res.json({
      code: 0,
      message: '更新成功',
      data: user
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 生成家长绑定码
 * POST /api/auth/parent-code
 */
router.post('/parent-code', require('../middleware/auth'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    let code = user.parentCode

    if (!code) {
      code = await user.generateParentCode()
    }

    res.json({
      code: 0,
      message: 'success',
      data: { code }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 绑定家长
 * POST /api/auth/bind-parent
 */
router.post('/bind-parent', require('../middleware/auth'), async (req, res, next) => {
  try {
    const { parentCode } = req.body

    if (!parentCode) {
      return res.status(400).json({
        code: 400,
        message: '缺少家长码',
        data: null
      })
    }

    // 查找家长
    const parent = await User.findOne({ parentCode, role: 'parent' })

    if (!parent) {
      return res.status(404).json({
        code: 404,
        message: '家长码无效',
        data: null
      })
    }

    // 更新当前用户
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { parentId: parent._id },
      { new: true }
    )

    res.json({
      code: 0,
      message: '绑定成功',
      data: { parentId: parent._id }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
