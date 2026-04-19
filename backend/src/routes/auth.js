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
const authMiddleware = require('../middleware/auth')

/**
 * 微信登录
 * POST /api/auth/login
 * 公开接口，限流15分钟5次
 * 
 * 请求体：
 * { code: string } // 微信授权code
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

    // 生成JWT Access Token (2小时有效期)
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        openid: user.openid,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    )

    // 生成Refresh Token (7天有效期)
    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
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
          age: user.age,
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
 * 公开接口
 * 
 * 请求体：
 * { refreshToken: string }
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
    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    } catch (verifyError) {
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 401,
          message: 'refreshToken已过期，请重新登录',
          data: null
        })
      }
      return res.status(401).json({
        code: 401,
        message: 'refreshToken无效',
        data: null
      })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      })
    }

    // 生成新Access Token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
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
    next(error)
  }
})

/**
 * 获取用户资料
 * GET /api/auth/profile
 * 需要登录
 */
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-__v -openid -unionid')

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
 * 需要登录
 * 
 * 请求体：
 * { nickname?: string, avatar?: string, age?: number }
 */
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { nickname, avatar, age } = req.body
    const updates = {}

    if (nickname !== undefined) updates.nickname = nickname
    if (avatar !== undefined) updates.avatar = avatar
    if (age !== undefined) {
      if (age < 6 || age > 18) {
        return res.status(400).json({
          code: 400,
          message: '年龄必须在6-18岁之间',
          data: null
        })
      }
      updates.age = age
    }

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
 * 需要登录
 */
router.post('/parent-code', authMiddleware, async (req, res, next) => {
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
 * 需要登录（孩子账号）
 * 
 * 请求体：
 * { parentCode: string }
 */
router.post('/bind-parent', authMiddleware, async (req, res, next) => {
  try {
    const { parentCode } = req.body
    const userId = req.user.id

    if (!parentCode) {
      return res.status(400).json({
        code: 400,
        message: '缺少家长码',
        data: null
      })
    }

    // 查找持有该码的家长
    const parent = await User.findOne({ parentCode, role: 'parent' })

    if (!parent) {
      return res.status(404).json({
        code: 404,
        message: '家长码无效',
        data: null
      })
    }

    // 不能绑定自己
    if (parent._id.toString() === userId) {
      return res.status(400).json({
        code: 400,
        message: '不能绑定自己',
        data: null
      })
    }

    // 更新当前用户（孩子）绑定家长
    const user = await User.findByIdAndUpdate(
      userId,
      { parentId: parent._id },
      { new: true }
    )

    logger.info('Child bound to parent:', { childId: userId, parentId: parent._id })

    res.json({
      code: 0,
      message: '绑定成功',
      data: {
        parentId: parent._id,
        parentNickname: parent.nickname
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 注册孩子账号
 * POST /api/auth/register/child
 * 公开接口
 * 
 * 请求体：
 * { openid: string, nickname?: string, age?: number }
 */
router.post('/register/child', async (req, res, next) => {
  try {
    const { openid, nickname, age } = req.body

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '缺少openid',
        data: null
      })
    }

    // 检查是否已存在
    const existingUser = await User.findOne({ openid })
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户已存在，请直接登录',
        data: null
      })
    }

    const user = await User.create({
      openid,
      role: 'child',
      nickname: nickname || '小小英语家',
      age: age || 10
    })

    logger.info('Child user registered:', { openid, userId: user._id })

    res.json({
      code: 0,
      message: '注册成功',
      data: {
        id: user._id,
        nickname: user.nickname,
        age: user.age
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 注册家长账号
 * POST /api/auth/register/parent
 * 公开接口
 * 
 * 请求体：
 * { openid: string, nickname?: string }
 */
router.post('/register/parent', async (req, res, next) => {
  try {
    const { openid, nickname } = req.body

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '缺少openid',
        data: null
      })
    }

    // 检查是否已存在
    const existingUser = await User.findOne({ openid })
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户已存在，请直接登录',
        data: null
      })
    }

    const user = await User.create({
      openid,
      role: 'parent',
      nickname: nickname || '家长'
    })

    logger.info('Parent user registered:', { openid, userId: user._id })

    res.json({
      code: 0,
      message: '注册成功',
      data: {
        id: user._id,
        nickname: user.nickname,
        parentCode: user.parentCode
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
