/**
 * 成就模型
 */

const mongoose = require('mongoose')

const AchievementSchema = new mongoose.Schema({
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
  icon: {
    type: String,
    default: '🏆'
  },
  type: {
    type: String,
    enum: ['badge', 'title', 'level'],
    default: 'badge'
  },
  condition: {
    type: {
      type: String,
      enum: ['session_count', 'streak_days', 'minutes_total', 'stars_total'],
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  reward: {
    type: Number,
    default: 5
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Achievement', AchievementSchema)
