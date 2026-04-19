/**
 * Session 模型 - 对话会话
 */

const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sceneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number,
    default: 0 // 秒
  },
  messageCount: {
    type: Number,
    default: 0
  },
  starsEarned: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  }
}, {
  timestamps: true
})

// 结束会话
SessionSchema.methods.complete = async function(data = {}) {
  this.status = 'completed'
  this.endTime = new Date()
  this.duration = Math.floor((this.endTime - this.startTime) / 1000)
  if (data.starsEarned) this.starsEarned = data.starsEarned
  if (data.rating) this.rating = data.rating
  await this.save()
  return this
}

// 计算本次获得星星
SessionSchema.methods.calculateStars = async function() {
  // 每轮对话1星，完整会话额外奖励
  let stars = this.messageCount

  // 时长奖励
  if (this.duration >= 300) stars += 2
  else if (this.duration >= 180) stars += 1

  this.starsEarned = stars
  await this.save()
  return stars
}

module.exports = mongoose.model('Session', SessionSchema)
