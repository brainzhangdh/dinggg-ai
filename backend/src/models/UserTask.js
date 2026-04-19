/**
 * 用户每日任务进度模型
 */

const mongoose = require('mongoose')

const UserTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  tasks: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyTask'
    },
    progress: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }]
}, {
  timestamps: true
})

// 复合索引确保用户每天只有一条记录
UserTaskSchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('UserTask', UserTaskSchema)
