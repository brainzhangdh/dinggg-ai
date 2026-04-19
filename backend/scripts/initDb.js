/**
 * 数据库初始化脚本
 * 运行: node scripts/initDb.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('../src/utils/logger')

// 引入模型
const Scene = require('../src/models/Scene')
const DailyTask = require('../src/models/DailyTask')
const Achievement = require('../src/models/Achievement')

// 默认场景数据
const defaultScenes = [
  {
    code: 'daily_greeting',
    name: '日常打招呼',
    nameEn: 'Daily Greeting',
    description: '练习简单的日常问候用语，如Hello、How are you等',
    ageRange: { min: 6, max: 12 },
    icon: '👋',
    systemPrompt: `You are a friendly English tutor for children aged 6-12.
Your name is "DingDong" 🦄
- Speak slowly and use very simple words
- Be encouraging and warm
- When correcting errors, say "Great job! Little tip: ..."
- Never be harsh or negative
- Keep responses short (under 30 words per turn)
- Use emojis to keep it fun 🎉`,
    initialMessage: 'Hello! I\'m DingDong! 👋 What\'s your name? Let\'s practice saying hello in English!',
    isFree: true,
    sortOrder: 1,
    isActive: true
  },
  {
    code: 'self_introduction',
    name: '自我介绍',
    nameEn: 'Self Introduction',
    description: '学习如何用英语介绍自己，包括姓名、年龄、爱好等',
    ageRange: { min: 6, max: 15 },
    icon: '🤝',
    systemPrompt: `You are a friendly English tutor for children.
Your name is "DingDong" 🦄
- Help the child introduce themselves in English
- Ask about their name, age, hobbies, school
- Be patient and encouraging
- Use simple vocabulary
- Keep responses short and fun`,
    initialMessage: 'Hi there! I\'m DingDong! What\'s your name? Can you tell me a little about yourself? 🎉',
    isFree: true,
    sortOrder: 2,
    isActive: true
  },
  {
    code: 'school_life',
    name: '校园生活',
    nameEn: 'School Life',
    description: '谈论学校生活，包括科目、老师、朋友、活动等',
    ageRange: { min: 8, max: 18 },
    icon: '🏫',
    systemPrompt: `You are a friendly English tutor focusing on school life vocabulary.
Your name is "DingDong" 🦄
- Help children talk about their school in English
- Introduce school-related vocabulary naturally
- Be encouraging and supportive
- Gently correct any mistakes
- Keep conversations fun and engaging`,
    initialMessage: 'Hey! Tell me about your school! What\'s your favorite subject? 📚',
    isFree: true,
    sortOrder: 3,
    isActive: true
  },
  {
    code: 'hobbies',
    name: '兴趣爱好',
    nameEn: 'Hobbies & Interests',
    description: '分享和讨论兴趣爱好，如运动、音乐、阅读等',
    ageRange: { min: 6, max: 18 },
    icon: '⚽',
    systemPrompt: `You are a fun English tutor interested in children's hobbies.
Your name is "DingDong" 🦄
- Ask about hobbies and interests
- Help expand vocabulary around activities
- Be enthusiastic and match their interests
- Keep it conversational and fun
- Use simple words for young learners`,
    initialMessage: 'Hi friend! What do you like to do for fun? Do you like sports, music, or playing games? 🎮',
    isFree: false,
    sortOrder: 4,
    isActive: true
  },
  {
    code: 'family',
    name: '家庭成员',
    nameEn: 'Family Members',
    description: '学习描述家庭成员和关系的英语表达',
    ageRange: { min: 6, max: 12 },
    icon: '👨‍👩‍👧',
    systemPrompt: `You are a warm and friendly English tutor.
Your name is "DingDong" 🦄
- Help children talk about their family in English
- Teach family member vocabulary naturally
- Be gentle and supportive
- Keep it age-appropriate
- Make it fun with emojis`,
    initialMessage: 'Hello! Who is in your family? Can you tell me about your mom, dad, or siblings? 👨‍👩‍👧',
    isFree: false,
    sortOrder: 5,
    isActive: true
  },
  {
    code: 'weather_seasons',
    name: '天气与季节',
    nameEn: 'Weather & Seasons',
    description: '学习谈论天气、季节和穿着的英语表达',
    ageRange: { min: 7, max: 14 },
    icon: '☀️',
    systemPrompt: `You are a cheerful English tutor.
Your name is "DingDong" 🦄
- Teach weather and season vocabulary
- Make conversations natural and fun
- Include temperature expressions
- Be encouraging with pronunciation
- Use emojis to make it engaging`,
    initialMessage: 'Hi! What\'s the weather like today where you are? Is it sunny, rainy, or snowy? ☔',
    isFree: false,
    sortOrder: 6,
    isActive: true
  },
  {
    code: 'food_diet',
    name: '美食与饮食',
    nameEn: 'Food & Diet',
    description: '讨论喜欢的食物、健康饮食和餐桌礼仪',
    ageRange: { min: 6, max: 18 },
    icon: '🍎',
    systemPrompt: `You are a fun English tutor who loves talking about food!
Your name is "DingDong" 🦄
- Help children discuss their favorite foods
- Teach restaurant and diet vocabulary
- Make it deliciously engaging
- Be patient with corrections
- Keep it fun and lighthearted`,
    initialMessage: 'Yum! What\'s your favorite food? Do you like pizza, pasta, or maybe something else? 🍕',
    isFree: false,
    sortOrder: 7,
    isActive: true
  },
  {
    code: 'travel_adventure',
    name: '旅行探索',
    nameEn: 'Travel & Adventure',
    description: '假想旅行场景，学习目的地、交通工具和行程描述',
    ageRange: { min: 8, max: 18 },
    icon: '✈️',
    systemPrompt: `You are an adventurous English tutor!
Your name is "DingDong" 🦄
- Help children imagine and describe travels
- Teach travel and transportation vocabulary
- Make it exciting and imaginative
- Be encouraging
- Keep responses fun and engaging`,
    initialMessage: 'Wow! If you could travel anywhere in the world, where would you go? Let\'s imagine an adventure! ✈️',
    isFree: false,
    sortOrder: 8,
    isActive: true
  },
  {
    code: 'festivals',
    name: '节日庆典',
    nameEn: 'Festivals & Holidays',
    description: '介绍中外节日，学习节日相关词汇和祝福语',
    ageRange: { min: 6, max: 18 },
    icon: '🎄',
    systemPrompt: `You are a festive English tutor!
Your name is "DingDong" 🦄
- Teach holiday and festival vocabulary
- Make cultural learning fun
- Encourage children to share traditions
- Be warm and celebratory
- Use emojis to create festive mood`,
    initialMessage: 'Party time! What\'s your favorite holiday? Christmas, Spring Festival, or Halloween? 🎃',
    isFree: false,
    sortOrder: 9,
    isActive: true
  },
  {
    code: 'animals_nature',
    name: '动物与自然',
    nameEn: 'Animals & Nature',
    description: '认识动物名称、特征和环保意识的英语表达',
    ageRange: { min: 6, max: 12 },
    icon: '🦁',
    systemPrompt: `You are a playful English tutor who loves animals!
Your name is "DingDong" 🦄
- Teach animal and nature vocabulary
- Make it fun with animal facts
- Encourage environmental awareness gently
- Be patient and encouraging
- Keep it exciting for kids`,
    initialMessage: 'Roar! What\'s your favorite animal? Do you like lions, dolphins, or maybe butterflies? 🦋',
    isFree: false,
    sortOrder: 10,
    isActive: true
  }
]

// 默认每日任务
const defaultTasks = [
  {
    code: 'daily_conversation',
    name: '日常对话',
    description: '完成1次英语对话练习',
    type: 'session',
    target: 1,
    reward: 3,
    isActive: true
  },
  {
    code: 'practice_10min',
    name: '专注练习',
    description: '累计练习10分钟',
    type: 'minutes',
    target: 10,
    reward: 5,
    isActive: true
  },
  {
    code: 'try_new_scene',
    name: '探索新场景',
    description: '尝试1个新场景',
    type: 'scenes',
    target: 1,
    reward: 4,
    isActive: true
  }
]

// 默认成就
const defaultAchievements = [
  {
    code: 'first_words',
    name: '初露锋芒',
    description: '完成第一次英语对话',
    icon: '🌟',
    type: 'badge',
    condition: { type: 'session_count', value: 1 },
    reward: 5,
    sortOrder: 1
  },
  {
    code: 'ten_sessions',
    name: '小有所成',
    description: '完成10次英语对话',
    icon: '🥉',
    type: 'badge',
    condition: { type: 'session_count', value: 10 },
    reward: 20,
    sortOrder: 2
  },
  {
    code: 'fifty_sessions',
    name: '坚持不懈',
    description: '完成50次英语对话',
    icon: '🥈',
    type: 'badge',
    condition: { type: 'session_count', value: 50 },
    reward: 50,
    sortOrder: 3
  },
  {
    code: 'streak_3',
    name: '连续打卡3天',
    description: '连续3天每天练习',
    icon: '🔥',
    type: 'badge',
    condition: { type: 'streak_days', value: 3 },
    reward: 10,
    sortOrder: 4
  },
  {
    code: 'streak_7',
    name: '一周之星',
    description: '连续7天每天练习',
    icon: '⭐',
    type: 'badge',
    condition: { type: 'streak_days', value: 7 },
    reward: 25,
    sortOrder: 5
  },
  {
    code: 'streak_30',
    name: '月度达人',
    description: '连续30天每天练习',
    icon: '💎',
    type: 'badge',
    condition: { type: 'streak_days', value: 30 },
    reward: 100,
    sortOrder: 6
  },
  {
    code: 'hours_1',
    name: '学习达人',
    description: '累计学习达到1小时',
    icon: '📚',
    type: 'badge',
    condition: { type: 'minutes_total', value: 60 },
    reward: 15,
    sortOrder: 7
  },
  {
    code: 'stars_100',
    name: '星星收藏家',
    description: '累计获得100颗星星',
    icon: '🌙',
    type: 'badge',
    condition: { type: 'stars_total', value: 100 },
    reward: 30,
    sortOrder: 8
  }
]

async function initDatabase() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('✅ MongoDB connected')

    // 初始化场景
    logger.info('📦 Initializing scenes...')
    for (const scene of defaultScenes) {
      await Scene.findOneAndUpdate(
        { code: scene.code },
        scene,
        { upsert: true, new: true }
      )
    }
    logger.info(`✅ ${defaultScenes.length} scenes initialized`)

    // 初始化每日任务
    logger.info('📦 Initializing daily tasks...')
    for (const task of defaultTasks) {
      await DailyTask.findOneAndUpdate(
        { code: task.code },
        task,
        { upsert: true, new: true }
      )
    }
    logger.info(`✅ ${defaultTasks.length} daily tasks initialized`)

    // 初始化成就
    logger.info('📦 Initializing achievements...')
    for (const achievement of defaultAchievements) {
      await Achievement.findOneAndUpdate(
        { code: achievement.code },
        achievement,
        { upsert: true, new: true }
      )
    }
    logger.info(`✅ ${defaultAchievements.length} achievements initialized`)

    logger.info('🎉 Database initialization complete!')
    process.exit(0)
  } catch (error) {
    logger.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

initDatabase()
