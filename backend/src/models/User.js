/**
 * User 模型
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionid: {
    type: String,
    sparse: true,
    index: true
  },
  nickname: {
    type: String,
    default: '小小英语家'
  },
  avatar: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    min: 6,
    max: 18,
    default: 10
  },
  role: {
    type: String,
    enum: ['child', 'parent'],
    default: 'child'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  parentCode: {
    type: String,
    length: 6,
    index: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'monthly', 'yearly'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalMinutes: {
      type: Number,
      default: 0
    },
    totalStars: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastPracticeDate: Date
  }
}, {
  timestamps: true
})

// 生成家长绑定码
UserSchema.methods.generateParentCode = async function() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  this.parentCode = code
  await this.save()
  return code
}

// 更新统计
UserSchema.methods.updateStats = async function(updates) {
  const { totalSessions = 0, totalMinutes = 0, totalStars = 0 } = updates

  // 检查是否连续打卡
  const today = new Date().toDateString()
  const lastDate = this.stats.lastPracticeDate
    ? new Date(this.stats.lastPracticeDate).toDateString()
    : null

  let streakDays = this.stats.streakDays
  if (lastDate !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (lastDate === yesterday.toDateString()) {
      streakDays += 1
    } else {
      streakDays = 1
    }
  }

  this.stats = {
    ...this.stats,
    totalSessions: this.stats.totalSessions + totalSessions,
    totalMinutes: this.stats.totalMinutes + totalMinutes,
    totalStars: this.stats.totalStars + totalStars,
    streakDays,
    lastPracticeDate: new Date()
  }

  await this.save()
  return this.stats
}

module.exports = mongoose.model('User', UserSchema)
