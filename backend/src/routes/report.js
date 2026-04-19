/**
 * 学习报告路由
 * - 今日学习报告
 * - 本周学习报告
 * - 总体学习报告（家长端）
 * - 单次会话详情报告
 * - 进步曲线计算
 */

const express = require('express')
const router = express.Router()
const Report = require('../models/Report')
const Session = require('../models/Session')
const Message = require('../models/Message')
const User = require('../models/User')
const Scene = require('../models/Scene')
const logger = require('../utils/logger')

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
      report = await generateDailyReport(userId, today)
    }

    // 获取昨日数据用于对比
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdayReport = await Report.findOne({ userId, date: yesterdayStr })

    // 计算进步
    const improvement = calculateImprovement(report, yesterdayReport)

    res.json({
      code: 0,
      message: 'success',
      data: {
        date: today,
        summary: report.summary,
        improvement,
        highlights: report.highlights,
        suggestions: report.suggestions,
        streakDays: (await User.findById(userId))?.stats.streakDays || 0
      }
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

    // 获取本周所有会话
    const sessions = await Session.find({
      userId,
      startTime: { $gte: weekStart, $lt: weekEnd }
    }).populate('sceneId')

    // 逐日统计数据
    const dailyData = []
    let totalMinutes = 0
    let totalMessages = 0
    let totalStars = 0
    const sceneSet = new Set()
    const ratings = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayStart = new Date(date)
      const dayEnd = new Date(dayStart.getTime() + 86400000)

      const daySessions = sessions.filter(
        s => s.startTime >= dayStart && s.startTime < dayEnd
      )

      const dayMinutes = Math.round(
        daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
      )
      const dayMessages = daySessions.reduce((sum, s) => sum + s.messageCount, 0)
      const dayStars = daySessions.reduce((sum, s) => sum + (s.starsEarned || 0), 0)

      daySessions.forEach(s => {
        if (s.rating) ratings.push(s.rating)
      })
      daySessions.forEach(s => sceneSet.add(s.sceneId?.name || s.sceneId?.toString()))

      totalMinutes += dayMinutes
      totalMessages += dayMessages
      totalStars += dayStars

      dailyData.push({
        date: dateStr,
        dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i],
        sessionsCount: daySessions.length,
        totalMinutes: dayMinutes,
        totalMessages: dayMessages,
        totalStars: dayStars
      })
    }

    // 获取上周数据进行对比
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(lastWeekStart)
    lastWeekEnd.setDate(lastWeekStart.getDate() + 7)

    const lastWeekSessions = await Session.find({
      userId,
      startTime: { $gte: lastWeekStart, $lt: lastWeekEnd }
    })
    const lastWeekMinutes = Math.round(
      lastWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    )

    // 进步曲线数据
    const improvement = {
      vsLastWeek: totalMinutes - lastWeekMinutes,
      vsLastWeekPercent: lastWeekMinutes > 0
        ? Math.round(((totalMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
        : totalMinutes > 0 ? 100 : 0
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: new Date(weekEnd.getTime() - 1).toISOString().split('T')[0],
        dailyData,
        summary: {
          totalSessions: sessions.length,
          totalMinutes,
          totalMessages,
          totalStars,
          avgSessionLength: sessions.length > 0
            ? Math.round(totalMinutes / sessions.length)
            : 0,
          avgRating: ratings.length > 0
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : 0,
          scenesExplored: sceneSet.size
        },
        improvement,
        topScenes: Array.from(sceneSet).slice(0, 5)
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
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      })
    }

    // 获取所有会话
    const sessions = await Session.find({ userId }).populate('sceneId')

    // 计算总体统计
    const totalMinutes = Math.round(
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    )
    const avgSessionLength = sessions.length > 0
      ? Math.round(totalMinutes / sessions.length)
      : 0

    // 获取消息计算平均评分
    const sessionIds = sessions.map(s => s._id)
    const messages = await Message.find({ sessionId: { $in: sessionIds } })
    const ratings = sessions.filter(s => s.rating).map(s => s.rating)
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0

    // 按场景分组统计
    const sceneStats = {}
    const sceneMap = new Map()

    for (const session of sessions) {
      const sceneId = session.sceneId._id.toString()
      const sceneName = session.sceneId.name || '未知场景'

      if (!sceneStats[sceneId]) {
        sceneStats[sceneId] = {
          name: sceneName,
          icon: session.sceneId.icon || '📚',
          sessions: 0,
          minutes: 0,
          stars: 0,
          avgRating: 0,
          ratings: []
        }
        sceneMap.set(sceneId, sceneName)
      }

      sceneStats[sceneId].sessions += 1
      sceneStats[sceneId].minutes += Math.round((session.duration || 0) / 60)
      sceneStats[sceneId].stars += session.starsEarned || 0
      if (session.rating) {
        sceneStats[sceneId].ratings.push(session.rating)
      }
    }

    // 计算各场景平均评分
    const sceneArray = Object.entries(sceneStats).map(([id, stats]) => ({
      sceneId: id,
      name: stats.name,
      icon: stats.icon,
      sessions: stats.sessions,
      minutes: stats.minutes,
      stars: stats.stars,
      avgRating: stats.ratings.length > 0
        ? Math.round((stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length) * 10) / 10
        : 0
    }))

    // 按练习时长排序
    sceneArray.sort((a, b) => b.minutes - a.minutes)

    // 计算进步趋势（近7天 vs 前7天）
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const thisWeekSessions = sessions.filter(s => s.startTime >= thisWeekStart)
    const lastWeekSessions = sessions.filter(
      s => s.startTime >= lastWeekStart && s.startTime < thisWeekStart
    )

    const thisWeekMinutes = Math.round(
      thisWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    )
    const lastWeekMinutes = Math.round(
      lastWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    )

    // 生成AI建议
    const suggestions = generateSuggestions({
      totalSessions: sessions.length,
      totalMinutes,
      avgSessionLength,
      streakDays: user.stats.streakDays,
      thisWeekMinutes,
      lastWeekMinutes,
      topScene: sceneArray[0]
    })

    res.json({
      code: 0,
      message: 'success',
      data: {
        user: {
          nickname: user.nickname,
          avatar: user.avatar,
          age: user.age,
          subscription: user.subscription
        },
        stats: {
          totalSessions: sessions.length,
          totalMinutes,
          totalStars: user.stats.totalStars,
          streakDays: user.stats.streakDays,
          avgSessionLength,
          avgRating,
          avgMessagesPerSession: sessions.length > 0
            ? Math.round(messages.length / sessions.length)
            : 0
        },
        sceneStats: sceneArray,
        trend: {
          thisWeekMinutes,
          lastWeekMinutes,
          change: thisWeekMinutes - lastWeekMinutes,
          changePercent: lastWeekMinutes > 0
            ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
            : thisWeekMinutes > 0 ? 100 : 0
        },
        suggestions
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取单次会话详情报告
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

    // 统计纠错情况
    const corrections = messages.filter(m => m.correction?.hasError)
    const correctionsFixed = corrections.map(c => ({
      original: c.correction.originalText || c.userText,
      corrected: c.correction.correctedText,
      tip: c.correction.tip
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        session: {
          _id: session._id,
          sceneName: session.sceneId?.name || '未知场景',
          sceneIcon: session.sceneId?.icon || '📚',
          startTime: session.startTime,
          endTime: session.endTime,
          duration: Math.round((session.duration || 0) / 60),
          messageCount: session.messageCount,
          starsEarned: session.starsEarned,
          rating: session.rating
        },
        messages: messages.map(m => ({
          role: m.role,
          type: m.type,
          text: m.role === 'user' ? m.userText : m.aiText,
          audioUrl: m.role === 'user' ? m.userAudioUrl : m.aiAudioUrl,
          correction: m.correction?.hasError ? m.correction : null,
          createdAt: m.createdAt
        })),
        highlights: generateHighlights(session, messages),
        corrections: correctionsFixed,
        stats: {
          correctionsCount: corrections.length,
          selfCorrectionRate: messages.length > 0
            ? Math.round(((messages.length - corrections.length) / messages.length) * 100)
            : 100
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 进步曲线数据
 * GET /api/report/progress
 */
router.get('/progress', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { days = 30 } = req.query

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(days) + 1)
    startDate.setHours(0, 0, 0, 0)

    // 获取日期范围内的所有报告
    const reports = await Report.find({
      userId,
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    }).sort({ date: 1 })

    // 填充缺失的日期
    const dateMap = new Map(reports.map(r => [r.date, r]))
    const progressData = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const report = dateMap.get(dateStr)

      progressData.push({
        date: dateStr,
        dayName: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
        sessionsCount: report?.summary?.sessionsCount || 0,
        totalMinutes: report?.summary?.totalMinutes || 0,
        starsEarned: 0, // 从会话数据汇总
        streak: report ? 1 : 0 // 有报告表示当天有练习
      })
    }

    // 汇总统计
    const totalMinutes = progressData.reduce((sum, d) => sum + d.totalMinutes, 0)
    const totalSessions = progressData.reduce((sum, d) => sum + d.sessionsCount, 0)
    const activeDays = progressData.filter(d => d.sessionsCount > 0).length

    res.json({
      code: 0,
      message: 'success',
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days: parseInt(days)
        },
        dailyData: progressData,
        summary: {
          totalMinutes,
          totalSessions,
          activeDays,
          avgMinutesPerDay: Math.round(totalMinutes / parseInt(days)),
          avgSessionsPerDay: Math.round((totalSessions / parseInt(days)) * 10) / 10
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 生成每日报告
 */
async function generateDailyReport(userId, date) {
  const todayStart = new Date(date)
  const todayEnd = new Date(todayStart.getTime() + 86400000)

  // 获取今日会话
  const sessions = await Session.find({
    userId,
    startTime: { $gte: todayStart, $lt: todayEnd }
  }).populate('sceneId')

  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
  )
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)
  const totalStars = sessions.reduce((sum, s) => sum + (s.starsEarned || 0), 0)
  const sceneNames = [...new Set(sessions.map(s => s.sceneId?.name).filter(Boolean))]
  const ratings = sessions.filter(s => s.rating).map(s => s.rating)

  // 获取用户连续打卡天数
  const user = await User.findById(userId)
  const streakDays = user?.stats?.streakDays || 0

  // 生成亮点
  const highlights = generateSessionHighlights(sessions, totalMinutes, totalStars, streakDays)

  // 生成建议
  const suggestions = generateDailySuggestions(sessions, totalMinutes, sceneNames, streakDays)

  // 创建或更新报告
  const report = await Report.findOneAndUpdate(
    { userId, date },
    {
      userId,
      date,
      summary: {
        sessionsCount: sessions.length,
        totalMinutes,
        totalMessages,
        scenes: sceneNames,
        averageRating: ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0
      },
      highlights,
      suggestions
    },
    { upsert: true, new: true }
  )

  return report
}

/**
 * 计算进步对比
 */
function calculateImprovement(currentReport, yesterdayReport) {
  if (!yesterdayReport) {
    return {
      vsYesterday: currentReport.summary.totalMinutes,
      vsYesterdayPercent: currentReport.summary.totalMinutes > 0 ? 100 : 0,
      vsLastWeek: 0,
      vsLastWeekPercent: 0
    }
  }

  const vsYesterday = currentReport.summary.totalMinutes - yesterdayReport.summary.totalMinutes
  const vsYesterdayPercent = yesterdayReport.summary.totalMinutes > 0
    ? Math.round((vsYesterday / yesterdayReport.summary.totalMinutes) * 100)
    : vsYesterday > 0 ? 100 : 0

  return {
    vsYesterday,
    vsYesterdayPercent,
    vsLastWeek: currentReport.improvement?.vsLastWeek || 0,
    vsLastWeekPercent: currentReport.improvement?.vsLastWeekPercent || 0
  }
}

/**
 * 生成会话亮点
 */
function generateSessionHighlights(sessions, totalMinutes, totalStars, streakDays = 0) {
  const highlights = []

  if (sessions.length >= 3) {
    highlights.push(`💪 今日完成了${sessions.length}次对话练习！`)
  }

  if (totalMinutes >= 10) {
    highlights.push(`⏱️ 今日学习${totalMinutes}分钟，继续保持！`)
  } else if (totalMinutes >= 5) {
    highlights.push(`📚 今日学习了${totalMinutes}分钟，不错的开始！`)
  }

  if (totalStars >= 10) {
    highlights.push(`⭐ 今日获得${totalStars}颗星星，太棒了！`)
  }

  // 检查是否有高评分
  const highRatings = sessions.filter(s => s.rating && s.rating >= 4)
  if (highRatings.length > 0) {
    highlights.push(`🌟 有${highRatings.length}次对话获得了高分评价！`)
  }

  // 连续打卡提示
  if (streakDays >= 3) {
    highlights.push(`🔥 已经连续打卡${streakDays}天！`)
  }

  return highlights
}

/**
 * 生成每日建议
 */
function generateDailySuggestions(sessions, totalMinutes, scenes, streakDays = 0) {
  const suggestions = []

  if (sessions.length === 0) {
    suggestions.push('今天还没有开始练习哦，快去选择一个场景开始你的英语对话之旅吧！🌟')
    return suggestions
  }

  if (totalMinutes < 5) {
    suggestions.push('今天的练习时间有点短，建议再多练习几分钟，效果会更好哦！💪')
  }

  if (sessions.length < 2) {
    suggestions.push('可以尝试不同的场景，每个场景都能学到不同的表达方式！🎯')
  }

  if (scenes.length >= 2) {
    suggestions.push(`今天尝试了${scenes.length}个不同的场景，真棒！继续多元化练习吧！✨`)
  }

  // 打卡建议
  if (streakDays < 3) {
    suggestions.push('坚持每天练习可以养成好习惯哦！连续打卡会有特别奖励呢！🏆')
  }

  return suggestions.length > 0 ? suggestions : ['今天表现得很好！继续保持！🎉']
}

/**
 * 生成综合建议（用于总体报告）
 */
function generateSuggestions(data) {
  const suggestions = []

  if (data.totalSessions < 5) {
    suggestions.push('刚开始学习，多练习可以更快进步哦！建议每天至少完成一次对话。')
  }

  if (data.avgSessionLength < 3 && data.totalSessions > 0) {
    suggestions.push('每次练习时间有点短，试着让对话持续5分钟以上，效果会更好。')
  }

  if (data.streakDays < 3 && data.totalSessions > 0) {
    suggestions.push('连续打卡能让学习效果更好！坚持3天以上会有惊喜哦。')
  }

  if (data.thisWeekMinutes < data.lastWeekMinutes && data.totalSessions > 3) {
    suggestions.push('本周练习时间比上周少了些，记得保持练习节奏，不要间断哦！')
  }

  if (data.topScene && data.topScene.sessions >= 3) {
    suggestions.push(`看来你很喜欢"${data.topScene.name}"场景！可以试试其他场景，体验更多有趣对话。`)
  }

  if (suggestions.length === 0 && data.totalSessions >= 10) {
    suggestions.push('学习状态很棒！继续保持，你已经超过了大多数学习者！🌟')
  }

  if (suggestions.length === 0) {
    suggestions.push('继续加油！坚持每天练习，你一定会越来越棒的！💪')
  }

  return suggestions
}

module.exports = router
