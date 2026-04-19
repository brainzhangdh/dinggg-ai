/**
 * Scene 模型 - 学习场景
 */

const mongoose = require('mongoose')

const SceneSchema = new mongoose.Schema({
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
  nameEn: {
    type: String,
    required: true
  },
  description: String,
  ageRange: {
    min: {
      type: Number,
      default: 6
    },
    max: {
      type: Number,
      default: 18
    }
  },
  icon: {
    type: String,
    default: '💬'
  },
  systemPrompt: {
    type: String,
    required: true
  },
  initialMessage: {
    type: String,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 获取所有启用场景
SceneSchema.statics.getActiveScenes = async function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
}

// 获取免费场景
SceneSchema.statics.getFreeScenes = async function() {
  return this.find({ isActive: true, isFree: true })
    .sort({ sortOrder: 1 })
}

module.exports = mongoose.model('Scene', SceneSchema)
