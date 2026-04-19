/**
 * 任务路由
 */

const express = require('express')
const router = express.Router()

/**
 * 获取今日任务
 * GET /api/task/daily
 */
router.get('/daily', async (req, res, next) => {
  try {
    const userId = req.user.id

    // TODO: 实现任务逻辑
    const tasks = [
      {
        id: '1',
        name: '完成1次对话',
        description: '选择一个场景，完成至少3轮对话',
        type: 'session',
        target: 1,
        progress: 0,
        completed: false,
        reward: 2
      },
      {
        id: '2',
        name: '练习5分钟',
        description: '累计练习时长达到5分钟',
        type: 'minutes',
        target: 5,
        progress: 2,
        completed: false,
        reward: 3
      },
      {
        id: '3',
        name: '尝试新场景',
        description: '体验任意一个新场景',
        type: 'scenes',
        target: 1,
        progress: 0,
        completed: false,
        reward: 2
      }
    ]

    res.json({
      code: 0,
      message: 'success',
      data: tasks
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 完成任务
 * POST /api/task/daily/:id/complete
 */
router.post('/daily/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // TODO: 实现完成任务逻辑

    res.json({
      code: 0,
      message: '任务完成！',
      data: {
        reward: 2,
        totalStars: 15
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
