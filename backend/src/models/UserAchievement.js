/**
 * 用户成就记录模型
 */

const mongoose = require('mongoose')

const UserAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 复合索引确保用户不重复领取同一成就
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true })

module.exports = mongoose.model('UserAchievement', UserAchievementSchema)
