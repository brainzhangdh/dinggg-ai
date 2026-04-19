/**
 * 学习报告路由
 */

const express = require('express')
const router = express.Router()
const Report = require('../models/Report')
const Session = require('../models/Session')
const Message = require('../models/Message')
const User = require('../models/User')

/**
 * 今日学习报告
 * GET /api/report/daily
 */
router.get('/daily', async (req, res, next) => {
  try {
    const userId = req.user.id
    const today = new Date().toISOString().split('T')[0]

    // 查找今日报告
    let report = await Report.findOne({ userId, date: today })

    if (!report) {
      // 生成新报告
      const todayStart = new Date(today)
      const todayEnd = new Date(todayStart.getTime() + 86400000)

      const sessions = await Session.find({
        userId,
        startTime: { $gte: todayStart, $lt: todayEnd }
      })

      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
      const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)
      const totalStars = sessions.reduce((sum, s) => sum + s.starsEarned, 0)

      report = await Report.create({
        userId,
        date: today,
        summary: {
          sessionsCount: sessions.length,
          totalMinutes: Math.round(totalMinutes),
          totalMessages,
          scenes: sessions.map(s => s.sceneId.toString()),
          averageRating: sessions.length > 0
            ? sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length
            : 0
        }
      })
    }

    res.json({
      code: 0,
      message: 'success',
      data: report
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 本周学习报告
 * GET /api/report/weekly
 */
router.get('/weekly', async (req, res, next) => {
  try {
    const userId = req.user.id
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const sessions = await Session.find({
      userId,
      startTime: { $gte: weekStart, $lt: weekEnd }
    }).populate('sceneId')

    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const daySessions = sessions.filter(
        s => s.startTime.toISOString().split('T')[0] === dateStr
      )

      return {
        date: dateStr,
        sessionsCount: daySessions.length,
        totalMinutes: Math.round(
          daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
        ),
        totalMessages: daySessions.reduce((sum, s) => sum + s.messageCount, 0),
        totalStars: daySessions.reduce((sum, s) => sum + s.starsEarned, 0)
      }
    })

    res.json({
      code: 0,
      message: 'success',
      data: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: new Date(weekEnd - 1).toISOString().split('T')[0],
        dailyData,
        summary: {
          totalSessions: sessions.length,
          totalMinutes: Math.round(
            sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
          ),
          totalMessages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
          totalStars: sessions.reduce((sum, s) => sum + s.starsEarned, 0)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 总体学习报告（家长端）
 * GET /api/report/summary
 */
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user.id

    // 获取用户信息
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      })
    }

    // 获取所有会话统计
    const sessions = await Session.find({ userId })
    const messages = await Message.find({ sessionId: { $in: sessions.map(s => s._id) } })

    // 计算总体数据
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    const avgSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0
    const avgMessagesPerSession = sessions.length > 0
      ? messages.length / sessions.length / 2 // 除2因为有用户消息和AI消息
      : 0

    // 按场景分组统计
    const sceneStats = {}
    sessions.forEach(s => {
      const sceneId = s.sceneId.toString()
      if (!sceneStats[sceneId]) {
        sceneStats[sceneId] = { count: 0, minutes: 0, stars: 0 }
      }
      sceneStats[sceneId].count += 1
      sceneStats[sceneId].minutes += (s.duration || 0) / 60
      sceneStats[sceneId].stars += s.starsEarned
    })

    res.json({
      code: 0,
      message: 'success',
      data: {
        user: {
          nickname: user.nickname,
          avatar: user.avatar,
          subscription: user.subscription
        },
        stats: {
          totalSessions: sessions.length,
          totalMinutes: Math.round(totalMinutes),
          totalStars: user.stats.totalStars,
          streakDays: user.stats.streakDays,
          avgSessionLength: Math.round(avgSessionLength * 10) / 10,
          avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10
        },
        sceneStats
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 单次会话详情报告
 * GET /api/report/detail/:sessionId
 */
router.get('/detail/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params
    const userId = req.user.id

    const session = await Session.findOne({
      _id: sessionId,
      userId
    }).populate('sceneId')

    if (!session) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在',
        data: null
      })
    }

    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 })

    res.json({
      code: 0,
      message: 'success',
      data: {
        session,
        messages,
        highlights: generateHighlights(session, messages)
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 生成亮点描述
 */
function generateHighlights(session, messages) {
  const highlights = []

  if (session.messageCount >= 5) {
    highlights.push('💬 完成了较长的对话练习')
  }

  if (session.duration >= 300) {
    highlights.push('⏱️ 本次练习超过5分钟')
  }

  if (session.starsEarned >= 5) {
    highlights.push('⭐ 获得了大量星星')
  }

  // 检查是否有纠错
  const corrections = messages.filter(m => m.correction?.hasError)
  if (corrections.length > 0) {
    highlights.push(`📝 本次有${corrections.length}处表达得到改进`)
  }

  return highlights
}

module.exports = router
