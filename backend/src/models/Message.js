/**
 * Message 模型 - 消息记录
 */

const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  type: {
    type: String,
    enum: ['voice', 'text'],
    default: 'text'
  },
  // 用户消息
  userText: String,
  userAudioUrl: String,
  // AI回复
  aiText: String,
  aiAudioUrl: String,
  // 纠错信息
  correction: {
    hasError: {
      type: Boolean,
      default: false
    },
    originalText: String,
    correctedText: String,
    tip: String
  },
  starsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// 索引
MessageSchema.index({ sessionId: 1, createdAt: -1 })

module.exports = mongoose.model('Message', MessageSchema)
