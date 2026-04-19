/**
 * 每日任务配置模型
 */

const mongoose = require('mongoose')

const DailyTaskSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['session', 'minutes', 'scenes'],
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  reward: {
    type: Number,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('DailyTask', DailyTaskSchema)
