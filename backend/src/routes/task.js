/**
 * 任务路由
 * - 每日任务派发
 * - 任务进度追踪
 * - 任务完成奖励（星星）
 */

const express = require('express')
const router = express.Router()
const DailyTask = require('../models/DailyTask')
const UserTask = require('../models/UserTask')
const User = require('../models/User')
const Session = require('../models/Session')
const Message = require('../models/Message')
const logger = require('../utils/logger')

/**
 * 获取今日任务
 * GET /api/task/daily
 */
router.get('/daily', async (req, res, next) => {
  try {
    const userId = req.user.id
    const today = new Date().toISOString().split('T')[0]

    // 获取或创建今日任务记录
    let userTask = await UserTask.findOne({ userId, date: today })

    if (!userTask) {
      // 首次获取今日任务，需要初始化
      userTask = await initializeDailyTasks(userId, today)
    }

    // 填充任务详情
    const taskIds = userTask.tasks.map(t => t.taskId)
    const taskConfigs = await DailyTask.find({ _id: { $in: taskIds }, isActive: true })
    const taskMap = new Map(taskConfigs.map(t => [t._id.toString(), t]))

    // 获取用户今日实际数据用于更新进度
    const todayStats = await getTodayStats(userId, today)

    // 更新进度
    const tasks = userTask.tasks.map(task => {
      const config = taskMap.get(task.taskId.toString())
      if (!config) return null

      // 实时更新进度
      const progress = calculateProgress(config.type, task.progress, todayStats, config.target)

      return {
        id: task.taskId,
        code: config.code,
        name: config.name,
        description: config.description,
        type: config.type,
        target: config.target,
        progress: progress,
        completed: progress >= config.target,
        completedAt: task.completedAt,
        reward: config.reward
      }
    }).filter(Boolean)

    // 统计
    const completedCount = tasks.filter(t => t.completed).length
    const totalReward = tasks.reduce((sum, t) => sum + (t.completed ? t.reward : 0), 0)
    const maxReward = tasks.reduce((sum, t) => sum + t.reward, 0)

    res.json({
      code: 0,
      message: 'success',
      data: {
        date: today,
        tasks,
        stats: {
          completedCount,
          totalCount: tasks.length,
          earnedReward: totalReward,
          maxReward,
          allCompleted: completedCount === tasks.length
        }
      }
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
    const today = new Date().toISOString().split('T')[0]

    // 验证任务配置
    const taskConfig = await DailyTask.findById(id)
    if (!taskConfig || !taskConfig.isActive) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null
      })
    }

    // 获取或创建今日任务记录
    let userTask = await UserTask.findOne({ userId, date: today })
    if (!userTask) {
      userTask = await initializeDailyTasks(userId, today)
    }

    // 查找对应任务
    const taskIndex = userTask.tasks.findIndex(
      t => t.taskId.toString() === id
    )

    if (taskIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '今日任务中不存在该任务',
        data: null
      })
    }

    const userTaskItem = userTask.tasks[taskIndex]

    // 如果已完成，不重复奖励
    if (userTaskItem.completed) {
      return res.json({
        code: 0,
        message: '任务已完成',
        data: {
          alreadyCompleted: true,
          reward: 0,
          totalStars: (await User.findById(userId))?.stats.totalStars || 0
        }
      })
    }

    // 获取今日统计
    const todayStats = await getTodayStats(userId, today)
    const currentProgress = calculateProgress(
      taskConfig.type,
      userTaskItem.progress,
      todayStats,
      taskConfig.target
    )

    // 检查是否真的完成了
    if (currentProgress < taskConfig.target) {
      return res.status(400).json({
        code: 400,
        message: '任务进度未达标',
        data: {
          currentProgress,
          target: taskConfig.target
        }
      })
    }

    // 标记为完成
    userTask.tasks[taskIndex].completed = true
    userTask.tasks[taskIndex].completedAt = new Date()
    userTask.tasks[taskIndex].progress = taskConfig.target
    await userTask.save()

    // 发放星星奖励
    const user = await User.findById(userId)
    const previousStars = user.stats.totalStars
    user.stats.totalStars += taskConfig.reward
    await user.save()

    logger.info(`⭐ User ${userId} completed task ${taskConfig.code}, earned ${taskConfig.reward} stars`)

    // 获取更新后的任务列表统计
    const allTasks = await UserTask.findOne({ userId, date: today })
    const taskIds = allTasks.tasks.map(t => t.taskId)
    const taskConfigs = await DailyTask.find({ _id: { $in: taskIds }, isActive: true })
    const taskMap = new Map(taskConfigs.map(t => [t._id.toString(), t]))

    let totalEarned = 0
    let maxReward = 0
    for (const t of allTasks.tasks) {
      const config = taskMap.get(t.taskId.toString())
      if (config) {
        maxReward += config.reward
        if (t.completed) totalEarned += config.reward
      }
    }

    res.json({
      code: 0,
      message: '🎉 任务完成！',
      data: {
        taskId: id,
        taskName: taskConfig.name,
        reward: taskConfig.reward,
        totalStars: user.stats.totalStars,
        previousStars,
        todayStats: {
          earnedReward: totalEarned,
          maxReward,
          completedCount: allTasks.tasks.filter(t => t.completed).length,
          totalCount: allTasks.tasks.length
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 初始化每日任务
 */
async function initializeDailyTasks(userId, date) {
  // 获取所有活跃任务配置
  const taskConfigs = await DailyTask.find({ isActive: true })

  const tasks = taskConfigs.map(config => ({
    taskId: config._id,
    progress: 0,
    completed: false,
    completedAt: null
  }))

  // 创建用户今日任务记录
  const userTask = await UserTask.create({
    userId,
    date,
    tasks
  })

  return userTask
}

/**
 * 获取今日用户统计数据
 */
async function getTodayStats(userId, date) {
  const todayStart = new Date(date)
  const todayEnd = new Date(todayStart.getTime() + 86400000)

  // 获取今日会话
  const sessions = await Session.find({
    userId,
    startTime: { $gte: todayStart, $lt: todayEnd },
    status: 'completed'
  })

  // 获取今日消息（用于计算对话轮数）
  const sessionIds = sessions.map(s => s._id)
  const messages = await Message.find({
    sessionId: { $in: sessionIds }
  })

  // 获取今日尝试过的场景
  const uniqueScenes = new Set(sessions.map(s => s.sceneId.toString()))

  return {
    sessionsCount: sessions.length,
    totalMinutes: Math.floor(
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    ),
    totalMessages: messages.length,
    uniqueScenes: uniqueScenes.size,
    starsEarned: sessions.reduce((sum, s) => sum + (s.starsEarned || 0), 0)
  }
}

/**
 * 计算任务进度
 */
function calculateProgress(type, currentProgress, todayStats, target) {
  let progress = currentProgress || 0

  switch (type) {
    case 'session':
      // 完成的会话数
      progress = todayStats.sessionsCount
      break
    case 'minutes':
      // 练习分钟数
      progress = todayStats.totalMinutes
      break
    case 'scenes':
      // 尝试的场景数
      progress = todayStats.uniqueScenes
      break
    default:
      break
  }

  return Math.min(progress, target) // 不超过目标值
}

/**
 * 更新任务进度（内部方法，供其他模块调用）
 * 在每次对话/会话结束时调用
 * @param {string} userId - 用户ID
 * @param {object} io - Socket.io实例
 */
async function updateTaskProgress(userId, io) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const todayStats = await getTodayStats(userId, today)

    // 获取或创建今日任务记录
    let userTask = await UserTask.findOne({ userId, date: today })

    if (!userTask) {
      userTask = await initializeDailyTasks(userId, today)
    }

    // 获取任务配置
    const taskIds = userTask.tasks.map(t => t.taskId)
    const taskConfigs = await DailyTask.find({ _id: { $in: taskIds }, isActive: true })
    const taskMap = new Map(taskConfigs.map(t => [t._id.toString(), t]))

    const updatedTasks = []
    let anyNewlyCompleted = false

    for (let i = 0; i < userTask.tasks.length; i++) {
      const task = userTask.tasks[i]
      const config = taskMap.get(task.taskId.toString())

      if (!config || task.completed) continue

      const newProgress = calculateProgress(config.type, task.progress, todayStats, config.target)

      if (newProgress !== task.progress) {
        task.progress = newProgress

        // 检查是否刚刚完成
        if (newProgress >= config.target && !task.completed) {
          task.completed = true
          task.completedAt = new Date()
          anyNewlyCompleted = true

          // 发放奖励
          const user = await User.findById(userId)
          user.stats.totalStars += config.reward
          await user.save()

          // 通知客户端
          if (io) {
            io.to(userId).emit('task_completed', {
              taskId: task.taskId,
              taskName: config.name,
              reward: config.reward,
              totalStars: user.stats.totalStars
            })
          }

          logger.info(`⭐ User ${userId} auto-completed task ${config.code}, earned ${config.reward} stars`)
        }

        updatedTasks.push({
          taskId: task.taskId,
          name: config.name,
          progress: task.progress,
          completed: task.completed,
          reward: config.reward
        })
      }
    }

    if (updatedTasks.length > 0) {
      await userTask.save()
    }

    return updatedTasks
  } catch (error) {
    logger.error('Error updating task progress:', error)
    return []
  }
}

// 导出router，并附带内部方法供其他模块调用
router.updateTaskProgress = updateTaskProgress
router.initializeDailyTasks = initializeDailyTasks
module.exports = router
