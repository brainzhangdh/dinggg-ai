/**
 * 成就路由
 */

const express = require('express')
const router = express.Router()

/**
 * 获取成就列表
 * GET /api/achievement/list
 */
router.get('/list', async (req, res, next) => {
  try {
    const userId = req.user.id

    // TODO: 实现成就逻辑
    const achievements = [
      {
        id: '1',
        name: '初次开口',
        description: '完成第一次英语对话',
        icon: '🌟',
        earned: true,
        earnedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '连续3天打卡',
        description: '连续3天完成练习',
        icon: '🔥',
        earned: true,
        earnedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '话说30分钟',
        description: '累计练习30分钟',
        icon: '⏱️',
        earned: false
      }
    ]

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

    // TODO: 实现徽章逻辑
    const badges = [
      { id: '1', name: '英语小达人', icon: '🏅', level: 1 },
      { id: '2', name: '口语小明星', icon: '⭐', level: 2 }
    ]

    res.json({
      code: 0,
      message: 'success',
      data: badges
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
