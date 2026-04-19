/**
 * 对话路由
 * POST /api/chat/message 核心接口
 */

const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const Message = require('../models/Message')
const Scene = require('../models/Scene')
const User = require('../models/User')
const AIService = require('../services/aiService')
const { get: redisGet, setEx: redisSetEx, incr: redisIncr, expire: redisExpire } = require('../utils/redis')
const logger = require('../utils/logger')
const { messageLimiter } = require('../middleware/rateLimiter')
const authMiddleware = require('../middleware/auth')

/**
 * 获取场景列表
 * GET /api/chat/scenes
 * 公开接口，无需登录
 */
router.get('/scenes', async (req, res, next) => {
  try {
    const { free } = req.query

    let scenes
    if (free === 'true') {
      scenes = await Scene.getFreeScenes()
    } else {
      scenes = await Scene.getActiveScenes()
    }

    res.json({
      code: 0,
      message: 'success',
      data: scenes
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取场景详情
 * GET /api/chat/scenes/:id
 * 公开接口，无需登录
 */
router.get('/scenes/:id', async (req, res, next) => {
  try {
    const scene = await Scene.findById(req.params.id)

    if (!scene) {
      return res.status(404).json({
        code: 404,
        message: '场景不存在',
        data: null
      })
    }

    res.json({
      code: 0,
      message: 'success',
      data: scene
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 创建对话会话
 * POST /api/chat/session
 * 需要登录
 */
router.post('/session', authMiddleware, async (req, res, next) => {
  try {
    const { sceneId } = req.body
    const userId = req.user.id

    if (!sceneId) {
      return res.status(400).json({
        code: 400,
        message: '缺少sceneId',
        data: null
      })
    }

    // 检查配额（免费用户每日限制）
    const user = await User.findById(userId)
    if (user.subscription.plan === 'free') {
      const quotaKey = `user:quota:${userId}:${new Date().toDateString()}`
      const used = parseInt(await redisGet(quotaKey) || '0')

      if (used >= (parseInt(process.env.FREE_USER_DAILY_QUOTA) || 3)) {
        return res.status(403).json({
          code: 403,
          message: '今日免费次数已用完，请明天再来或开通会员',
          data: null
        })
      }
    }

    // 验证场景
    const scene = await Scene.findById(sceneId)
    if (!scene) {
      return res.status(404).json({
        code: 404,
        message: '场景不存在',
        data: null
      })
    }

    // 创建会话
    const session = await Session.create({
      userId,
      sceneId
    })

    logger.info('Session created:', { sessionId: session._id, userId, sceneId })

    res.json({
      code: 0,
      message: '创建成功',
      data: {
        sessionId: session._id,
        sceneName: scene.name,
        initialMessage: scene.initialMessage
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取会话历史
 * GET /api/chat/session/:id
 * 需要登录
 */
router.get('/session/:id', authMiddleware, async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('sceneId')

    if (!session) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在',
        data: null
      })
    }

    const messages = await Message.find({ sessionId: session._id })
      .sort({ createdAt: 1 })

    res.json({
      code: 0,
      message: 'success',
      data: {
        session,
        messages
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 发送消息（核心接口）
 * POST /api/chat/message
 * 需要登录，限流30次/分钟
 * 
 * 请求体：
 * {
 *   sessionId?: string,    // 会话ID（新会话可空）
 *   sceneId?: string,      // 场景ID（创建新会话时必填）
 *   type: 'voice' | 'text',
 *   text?: string,         // type=text时必填
 *   audioBase64?: string   // type=voice时必填
 * }
 */
router.post('/message', authMiddleware, messageLimiter, async (req, res, next) => {
  try {
    const { sessionId, sceneId, type, text, audioBase64 } = req.body
    const userId = req.user.id

    if (!sessionId && !sceneId) {
      return res.status(400).json({
        code: 400,
        message: '缺少sessionId或sceneId',
        data: null
      })
    }

    if (!type || !['voice', 'text'].includes(type)) {
      return res.status(400).json({
        code: 400,
        message: 'type必须是voice或text',
        data: null
      })
    }

    if (type === 'text' && !text) {
      return res.status(400).json({
        code: 400,
        message: '文本消息需要填写text字段',
        data: null
      })
    }

    if (type === 'voice' && !audioBase64) {
      return res.status(400).json({
        code: 400,
        message: '语音消息需要填写audioBase64字段',
        data: null
      })
    }

    let session

    // ========== 场景模式：创建新会话 ==========
    if (sceneId && !sessionId) {
      const scene = await Scene.findById(sceneId)
      if (!scene) {
        return res.status(404).json({
          code: 404,
          message: '场景不存在',
          data: null
        })
      }

      session = await Session.create({
        userId,
        sceneId
      })

      logger.info('New session created:', { sessionId: session._id, sceneId })
    } else {
      // ========== 已有会话模式 ==========
      session = await Session.findOne({
        _id: sessionId,
        userId
      })

      if (!session) {
        return res.status(404).json({
          code: 404,
          message: '会话不存在',
          data: null
        })
      }
    }

    // ========== 更新配额使用（免费用户） ==========
    const user = await User.findById(userId)
    if (user.subscription.plan === 'free') {
      const quotaKey = `user:quota:${userId}:${new Date().toDateString()}`
      await redisIncr(quotaKey)
      await redisExpire(quotaKey, 86400) // 当天有效
    }

    // ========== 获取历史消息 ==========
    const historyMessages = await Message.find({ sessionId: session._id })
      .sort({ createdAt: -1 })
      .limit(20)

    // ========== 获取场景信息 ==========
    const scene = await Scene.findById(session.sceneId)

    // ========== ASR语音识别 ==========
    let userText = text
    if (type === 'voice' && audioBase64) {
      try {
        const asrResult = await AIService.asr(audioBase64)
        userText = asrResult.text || text || 'I said something in English'
      } catch (asrError) {
        logger.error('ASR failed, using fallback:', asrError.message)
        userText = text || 'I spoke in English' // ASR失败时的降级方案
      }
    }

    // ========== AI对话 ==========
    let aiResponse
    try {
      aiResponse = await AIService.chat({
        scene,
        userText,
        history: historyMessages.reverse()
      })
    } catch (aiError) {
      logger.error('AI chat failed:', aiError.message)
      return res.status(500).json({
        code: 500,
        message: 'AI对话服务暂时不可用，请稍后重试',
        data: null
      })
    }

    // ========== 保存用户消息 ==========
    const userMessage = await Message.create({
      sessionId: session._id,
      role: 'user',
      type,
      userText,
      userAudioUrl: '' // 用户语音存储URL（可扩展）
    })

    // ========== 保存AI回复 ==========
    const aiMessage = await Message.create({
      sessionId: session._id,
      role: 'assistant',
      type: 'text',
      aiText: aiResponse.reply,
      aiAudioUrl: aiResponse.audioUrl || '',
      correction: aiResponse.correction,
      starsEarned: aiResponse.stars || 0
    })

    // ========== 更新会话统计 ==========
    session.messageCount += 1
    await session.save()

    // ========== 更新用户统计 ==========
    await user.updateStats({
      totalSessions: 0,
      totalMinutes: Math.ceil((aiResponse.duration || 60) / 60),
      totalStars: aiResponse.stars || 0
    })

    // ========== 通过Socket.io推送实时更新 ==========
    const io = req.app.get('io')
    if (io) {
      io.to(sessionId || session._id.toString()).emit('ai_stream', {
        messageId: aiMessage._id,
        text: aiResponse.reply,
        audioUrl: aiResponse.audioUrl,
        correction: aiResponse.correction,
        starsEarned: aiResponse.stars || 0
      })
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        messageId: aiMessage._id,
        text: aiResponse.reply,
        audioUrl: aiResponse.audioUrl,
        correction: aiResponse.correction,
        starsEarned: aiResponse.stars || 0,
        sessionId: session._id
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 结束对话会话
 * DELETE /api/chat/session/:id
 * 需要登录
 */
router.delete('/session/:id', authMiddleware, async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!session) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在',
        data: null
      })
    }

    // 计算星星
    const stars = await session.calculateStars()

    // 结束会话
    await session.complete({ starsEarned: stars })

    // 更新用户统计
    const user = await User.findById(req.user.id)
    await user.updateStats({
      totalSessions: 1,
      totalMinutes: Math.ceil(session.duration / 60),
      totalStars: stars
    })

    res.json({
      code: 0,
      message: '会话已结束',
      data: {
        duration: session.duration,
        messageCount: session.messageCount,
        starsEarned: stars
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
