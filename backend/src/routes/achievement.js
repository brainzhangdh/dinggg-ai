/**
 * 成就路由
 * - 获取成就列表
 * - 获取徽章墙
 * - 成就排行榜
 * - 检查并解锁新成就
 */

const express = require('express')
const router = express.Router()
const Achievement = require('../models/Achievement')
const UserAchievement = require('../models/UserAchievement')
const User = require('../models/User')
const Session = require('../models/Session')
const Message = require('../models/Message')
const logger = require('../utils/logger')

/**
 * 获取成就列表（我的成就）
 * GET /api/achievement/list
 */
router.get('/list', async (req, res, next) => {
  try {
    const userId = req.user.id

    // 获取用户已获得的成就
    const userAchievements = await UserAchievement.find({ userId })
      .populate('achievementId')
      .sort({ earnedAt: -1 })

    // 获取用户当前统计
    const user = await User.findById(userId)
    const userStats = user ? {
      totalSessions: user.stats.totalSessions,
      totalMinutes: user.stats.totalMinutes,
      totalStars: user.stats.totalStars,
      streakDays: user.stats.streakDays
    } : null

    // 获取所有成就定义
    const allAchievements = await Achievement.find().sort({ sortOrder: 1 })

    // 合并数据：已获得的标记earned=true，未获得的标记earned=false
    const earnedMap = new Map(
      userAchievements.map(ua => [ua.achievementId._id.toString(), ua])
    )

    const achievements = allAchievements.map(achievement => {
      const earned = earnedMap.get(achievement._id.toString())
      return {
        id: achievement._id,
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        reward: achievement.reward,
        earned: !!earned,
        earnedAt: earned ? earned.earnedAt.toISOString() : null,
        progress: earned ? 100 : calculateProgress(achievement, userStats)
      }
    })

    res.json({
      code: 0,
      message: 'success',
      data: achievements
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取徽章墙
 * GET /api/achievement/badges
 */
router.get('/badges', async (req, res, next) => {
  try {
    const userId = req.user.id

    // 获取用户已获得的徽章
    const userAchievements = await UserAchievement.find({ userId })
      .populate('achievementId')
      .sort({ earnedAt: -1 })

    // 按类型分组
    const badges = {
      earned: [],
      locked: []
    }

    for (const ua of userAchievements) {
      if (ua.achievementId.type === 'badge') {
        badges.earned.push({
          id: ua.achievementId._id,
          name: ua.achievementId.name,
          description: ua.achievementId.description,
          icon: ua.achievementId.icon,
          level: getBadgeLevel(ua.achievementId.code),
          earnedAt: ua.earnedAt.toISOString()
        })
      }
    }

    // 获取未获得的徽章
    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId._id.toString()))
    const allBadges = await Achievement.find({ type: 'badge' })
    for (const badge of allBadges) {
      if (!earnedIds.has(badge._id.toString())) {
        badges.locked.push({
          id: badge._id,
          name: badge.name,
          description: badge.description,
          icon: '🔒',
          level: getBadgeLevel(badge.code)
        })
      }
    }

    // 统计
    const stats = {
      totalEarned: badges.earned.length,
      totalBadges: allBadges.length,
      completionRate: allBadges.length > 0
        ? Math.round((badges.earned.length / allBadges.length) * 100)
        : 0
    }

    res.json({
      code: 0,
      message: 'success',
      data: { badges, stats }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 成就排行榜
 * GET /api/achievement/leaderboard
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit = 10, type = 'stars' } = req.query

    let sortField
    switch (type) {
      case 'sessions':
        sortField = 'stats.totalSessions'
        break
      case 'streak':
        sortField = 'stats.streakDays'
        break
      case 'stars':
      default:
        sortField = 'stats.totalStars'
    }

    // 获取排名前N的用户
    const users = await User.find({ role: 'child' })
      .select(`nickname avatar age stats.totalStars stats.totalSessions stats.streakDays ${sortField}`)
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .lean()

    // 获取这些用户的成就数量
    const userIds = users.map(u => u._id)
    const achievementCounts = await UserAchievement.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ])
    const countMap = new Map(achievementCounts.map(a => [a._id.toString(), a.count]))

    // 当前用户排名
    const currentUser = users.find(u => u._id.toString() === req.user.id)
    const allUsersCount = await User.countDocuments({ role: 'child' })
    const currentRank = currentUser
      ? users.findIndex(u => u._id.toString() === req.user.id) + 1
      : allUsersCount + 1

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      totalStars: user.stats.totalStars,
      totalSessions: user.stats.totalSessions,
      streakDays: user.stats.streakDays,
      achievementCount: countMap.get(user._id.toString()) || 0,
      isMe: user._id.toString() === req.user.id
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        leaderboard,
        myRank: currentRank,
        myStats: currentUser ? {
          totalStars: currentUser.stats.totalStars,
          totalSessions: currentUser.stats.totalSessions,
          streakDays: currentUser.stats.streakDays
        } : null
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 检查用户是否解锁新成就（内部方法，供其他模块调用）
 * @param {string} userId - 用户ID
 * @param {object} io - Socket.io实例
 */
async function checkAndAwardAchievements(userId, io) {
  try {
    const user = await User.findById(userId)
    if (!user) return []

    // 获取用户已获得的成就
    const earnedAchievements = await UserAchievement.find({ userId })
    const earnedIds = new Set(earnedAchievements.map(a => a.achievementId.toString()))

    // 获取所有未获得的成就
    const allAchievements = await Achievement.find()

    const userStats = {
      totalSessions: user.stats.totalSessions,
      totalMinutes: user.stats.totalMinutes,
      totalStars: user.stats.totalStars,
      streakDays: user.stats.streakDays
    }

    const newlyEarned = []

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement._id.toString())) continue

      if (checkCondition(achievement.condition, userStats)) {
        // 授予成就
        await UserAchievement.create({
          userId,
          achievementId: achievement._id
        })

        // 增加用户星星
        user.stats.totalStars += achievement.reward
        await user.save()

        const earned = {
          id: achievement._id,
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          reward: achievement.reward
        }
        newlyEarned.push(earned)

        // 发送成就解锁通知（通过Socket.io）
        if (io) {
          io.to(userId).emit('achievement_unlocked', {
            achievement: earned,
            totalStars: user.stats.totalStars
          })
        }

        logger.info(`🏆 User ${userId} earned achievement: ${achievement.name}`)
      }
    }

    return newlyEarned
  } catch (error) {
    logger.error('Error checking achievements:', error)
    return []
  }
}

/**
 * 检查成就条件是否满足
 */
function checkCondition(condition, stats) {
  switch (condition.type) {
    case 'session_count':
      return stats.totalSessions >= condition.value
    case 'streak_days':
      return stats.streakDays >= condition.value
    case 'minutes_total':
      return stats.totalMinutes >= condition.value
    case 'stars_total':
      return stats.totalStars >= condition.value
    default:
      return false
  }
}

/**
 * 计算成就进度（未完成时）
 */
function calculateProgress(achievement, stats) {
  if (!stats) return 0

  let current
  switch (achievement.condition.type) {
    case 'session_count':
      current = stats.totalSessions
      break
    case 'streak_days':
      current = stats.streakDays
      break
    case 'minutes_total':
      current = stats.totalMinutes
      break
    case 'stars_total':
      current = stats.totalStars
      break
    default:
      return 0
  }

  const progress = Math.min(100, Math.round((current / achievement.condition.value) * 100))
  return progress
}

/**
 * 获取徽章等级
 */
function getBadgeLevel(code) {
  const levels = {
    first_words: 1,
    ten_sessions: 2,
    fifty_sessions: 3,
    streak_3: 1,
    streak_7: 2,
    streak_30: 3,
    hours_1: 2,
    stars_100: 3
  }
  return levels[code] || 1
}

// 导出检查方法供其他模块使用
// 导出router，并附带内部方法供其他模块调用
router.checkAndAwardAchievements = checkAndAwardAchievements
module.exports = router
