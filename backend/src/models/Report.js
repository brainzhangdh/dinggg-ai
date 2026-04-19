/**
 * Report 模型 - 学习报告
 */

const mongoose = require('mongoose')

const ReportSchema = new mongoose.Schema({
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
  summary: {
    sessionsCount: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    scenes: [{ type: String }],
    averageRating: { type: Number, default: 0 }
  },
  improvement: {
    vsYesterday: { type: Number, default: 0 },
    vsLastWeek: { type: Number, default: 0 }
  },
  highlights: [{
    type: String
  }],
  suggestions: [{
    type: String
  }]
}, {
  timestamps: true
})

// 复合索引
ReportSchema.index({ userId: 1, date: -1 })

module.exports = mongoose.model('Report', ReportSchema)
