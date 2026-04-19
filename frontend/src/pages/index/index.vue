<!-- 顶呱呱AI宝 - 首页 -->
<template>
  <view class="index-page">
    <!-- 顶部欢迎区 -->
    <view class="welcome-section">
      <view class="greeting">
        <text class="hello-text">你好，{{ userInfo.nickname || '小小英语家' }} 👋</text>
        <text class="subtitle">今天想和AI外教聊什么？</text>
      </view>
      <view class="user-avatar" @tap="goToProfile">
        <image :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill" />
      </view>
    </view>

    <!-- 今日打卡 -->
    <view class="streak-card" @tap="goToReport">
      <view class="streak-info">
        <view class="streak-icon">🔥</view>
        <view class="streak-text">
          <text class="streak-count">{{ stats.streakDays || 0 }} 天</text>
          <text class="streak-label">连续打卡</text>
        </view>
      </view>
      <view class="today-progress">
        <text class="progress-text">今日已练习 {{ stats.todayMinutes || 0 }} 分钟</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 场景选择 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">选择场景</text>
        <text class="section-more" @tap="goToAllScenes">全部场景 ></text>
      </view>

      <view class="scene-grid">
        <view
          v-for="scene in scenes"
          :key="scene.id"
          class="scene-card"
          :class="{ free: scene.isFree }"
          @tap="selectScene(scene)"
        >
          <view class="scene-icon">{{ scene.icon }}</view>
          <text class="scene-name">{{ scene.name }}</text>
          <view v-if="scene.isFree" class="free-tag">免费</view>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="action-card" @tap="goToDailyTask">
        <view class="action-icon">📋</view>
        <text class="action-label">今日任务</text>
        <view class="action-badge" v-if="taskCount > 0">{{ taskCount }}</view>
      </view>
      <view class="action-card" @tap="goToAchievement">
        <view class="action-icon">🏆</view>
        <text class="action-label">我的成就</text>
      </view>
      <view class="action-card" @tap="goToParentMode">
        <view class="action-icon">👨‍👩‍👧</view>
        <text class="action-label">家长模式</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 用户信息
const userInfo = ref({
  nickname: '',
  avatar: ''
})

// 统计数据
const stats = ref({
  streakDays: 0,
  todayMinutes: 0
})

// 场景列表
const scenes = ref([
  { id: 1, name: '日常打招呼', icon: '👋', isFree: true },
  { id: 2, name: '看动画', icon: '📺', isFree: true },
  { id: 3, name: '交朋友', icon: '🤝', isFree: false },
  { id: 4, name: '学校生活', icon: '🏫', isFree: false },
  { id: 5, name: '旅行英语', icon: '✈️', isFree: false },
  { id: 6, name: '节日庆祝', icon: '🎉', isFree: false }
])

// 任务数量
const taskCount = ref(2)

// 进度百分比
const progressPercent = computed(() => {
  const target = 10 // 每日目标10分钟
  return Math.min((stats.value.todayMinutes / target) * 100, 100)
})

// 选择场景
function selectScene(scene) {
  uni.navigateTo({
    url: `/pages/chat/index?sceneId=${scene.id}&sceneName=${encodeURIComponent(scene.name)}`
  })
}

// 页面跳转
function goToProfile() {
  uni.navigateTo({ url: '/pages/profile/index' })
}

function goToReport() {
  uni.navigateTo({ url: '/pages/report/index' })
}

function goToAllScenes() {
  uni.navigateTo({ url: '/pages/scenes/index' })
}

function goToDailyTask() {
  uni.navigateTo({ url: '/pages/task/index' })
}

function goToAchievement() {
  uni.navigateTo({ url: '/pages/achievement/index' })
}

function goToParentMode() {
  uni.navigateTo({ url: '/pages/parent/index' })
}

// 初始化
onMounted(() => {
  // 加载用户信息
  // 加载统计数据
})
</script>

<style lang="scss" scoped>
.index-page {
  padding: $spacing-md;
  min-height: 100vh;
  background: linear-gradient(180deg, #E8E6FF 0%, #F5F7FA 30%);
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg 0;
}

.greeting {
  display: flex;
  flex-direction: column;
}

.hello-text {
  font-size: 20px;
  font-weight: 600;
  color: $text-primary;
}

.subtitle {
  font-size: 14px;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
}

.streak-card {
  background: linear-gradient(135deg, $primary-color 0%, #8B83FF 100%);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  color: $text-white;
}

.streak-info {
  display: flex;
  align-items: center;
}

.streak-icon {
  font-size: 32px;
  margin-right: $spacing-sm;
}

.streak-count {
  font-size: 24px;
  font-weight: 700;
}

.streak-label {
  font-size: 12px;
  opacity: 0.9;
}

.section {
  margin-bottom: $spacing-lg;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
}

.section-more {
  font-size: 14px;
  color: $primary-color;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
}

.scene-card {
  background: $card-bg;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: $shadow-sm;
  position: relative;
}

.scene-icon {
  font-size: 32px;
  margin-bottom: $spacing-sm;
}

.scene-name {
  font-size: 12px;
  color: $text-secondary;
  text-align: center;
}

.free-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: $success-color;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
}

.action-card {
  background: $card-bg;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: $shadow-sm;
  position: relative;
}

.action-icon {
  font-size: 24px;
  margin-bottom: $spacing-xs;
}

.action-label {
  font-size: 12px;
  color: $text-secondary;
}

.action-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: $error-color;
  color: white;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
