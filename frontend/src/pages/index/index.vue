<!-- 顶呱呱AI宝 - 首页 -->
<template>
  <view class="index-page">
    <!-- 顶部欢迎区 -->
    <view class="welcome-section">
      <view class="welcome-left">
        <text class="greeting-text">{{ greeting }}</text>
        <text class="user-name">{{ userInfo.nickname || '小小英语家' }} 👋</text>
        <text class="welcome-sub">今天想和谁用英语聊天呀？</text>
      </view>
      <view class="stars-display" @tap="goToMine">
        <text class="stars-icon">⭐</text>
        <text class="stars-count">{{ userInfo.stars || 0 }}</text>
      </view>
    </view>

    <!-- 呱呱吉祥物 + 打卡卡片 -->
    <view class="hero-section">
      <!-- 打卡卡片 -->
      <view class="checkin-card">
        <view class="checkin-left">
          <view class="frog-mini">
            <FrogCharacter size="sm" :mood="streakDays >= 7 ? 'celebrate' : 'happy'" />
          </view>
          <view class="checkin-info">
            <view class="streak-row">
              <text class="streak-fire">🔥</text>
              <text class="streak-days">{{ streakDays || 0 }}</text>
              <text class="streak-unit">天连续打卡</text>
            </view>
            <view class="today-progress-wrap">
              <text class="progress-label">今日已练习 {{ todayMinutes }} 分钟</text>
              <view class="progress-bar-sm">
                <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
              </view>
            </view>
          </view>
        </view>
        <view class="checkin-btn" @tap="goToReport">
          <text class="checkin-btn-text">学习报告</text>
        </view>
      </view>
    </view>

    <!-- 场景选择区 -->
    <view class="section scenes-section">
      <view class="section-header">
        <text class="section-title">选择场景</text>
        <text class="section-more" @tap="showAllScenes">更多场景 ></text>
      </view>

      <!-- 场景网格：2列 -->
      <view class="scene-grid">
        <SceneCard
          v-for="scene in displayScenes"
          :key="scene.id"
          :scene="scene"
          @tap="selectScene"
        />
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="action-card primary" @tap="goToDailyTask">
        <view class="action-icon-wrap">
          <text class="action-icon">📋</text>
        </view>
        <view class="action-texts">
          <text class="action-title">今日任务</text>
          <text class="action-desc">完成任务得双倍星星</text>
        </view>
        <view v-if="taskCount > 0" class="action-badge">
          <text class="badge-num">{{ taskCount }}</text>
        </view>
      </view>

      <view class="action-card secondary" @tap="goToAchievement">
        <view class="action-icon-wrap">
          <text class="action-icon">🏆</text>
        </view>
        <view class="action-texts">
          <text class="action-title">我的成就</text>
          <text class="action-desc">查看已获得的徽章</text>
        </view>
      </view>

      <view class="action-card tertiary" @tap="goToParentMode">
        <view class="action-icon-wrap">
          <text class="action-icon">👨‍👩‍👧</text>
        </view>
        <view class="action-texts">
          <text class="action-title">家长模式</text>
          <text class="action-desc">查看学习数据</text>
        </view>
      </view>
    </view>

    <!-- 底部TabBar占位 -->
    <view class="tabbar-placeholder" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FrogCharacter from '@/components/FrogCharacter/FrogCharacter.vue'
import SceneCard from '@/components/SceneCard/SceneCard.vue'

// 用户信息
const userInfo = ref({
  nickname: '',
  stars: 0,
  avatar: ''
})

// 统计数据
const streakDays = ref(7)
const todayMinutes = ref(12)

// 任务数
const taskCount = ref(2)

// 问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好～'
  if (hour < 18) return '下午好～'
  return '晚上好～'
})

// 进度
const progressPercent = computed(() => {
  const target = 15 // 每日目标15分钟
  return Math.min((todayMinutes.value / target) * 100, 100)
})

// 场景列表
const displayScenes = ref([
  {
    id: 1,
    name: '看动画聊英语',
    icon: '📺',
    description: '你最爱的动画片，用英语聊！',
    locked: false,
    color: '#5BA4F5',
    tag: '免费',
    tagType: 'free',
    starsCount: 3
  },
  {
    id: 2,
    name: '聊聊学校生活',
    icon: '🏫',
    description: '今天学校发生了什么？',
    locked: false,
    color: '#FB923C',
    tag: '免费',
    tagType: 'free',
    starsCount: 2
  },
  {
    id: 3,
    name: '交外国朋友',
    icon: '🤝',
    description: '认识新朋友，练练口语！',
    locked: false,
    color: '#A78BFA',
    tag: '热门',
    tagType: 'hot',
    starsCount: 5
  },
  {
    id: 4,
    name: '旅行英语',
    icon: '✈️',
    description: '模拟去旅行的英语对话',
    locked: true,
    color: '#38BDF8',
    starsCount: 5
  },
  {
    id: 5,
    name: '节日庆祝',
    icon: '🎄',
    description: '节日主题英语聊起来！',
    locked: true,
    color: '#F472B6',
    starsCount: 4
  },
  {
    id: 6,
    name: '面试练习',
    icon: '💼',
    description: '提前练习面试英语',
    locked: true,
    color: '#FBBF24',
    starsCount: 5
  }
])

function selectScene(scene) {
  uni.navigateTo({
    url: `/pages/chat/index?sceneId=${scene.id}&sceneName=${encodeURIComponent(scene.name)}`
  })
}

function goToMine() {
  uni.switchTab({ url: '/pages/mine/index' })
}

function goToReport() {
  uni.navigateTo({ url: '/pages/report/index' })
}

function goToDailyTask() {
  uni.navigateTo({ url: '/pages/task/index' })
}

function goToAchievement() {
  uni.navigateTo({ url: '/pages/achievement/index' })
}

function goToParentMode() {
  uni.switchTab({ url: '/pages/parent/index' })
}

function showAllScenes() {
  uni.navigateTo({ url: '/pages/scenes/index' })
}

onMounted(() => {
  // 加载用户信息
  const nickname = uni.getStorageSync('nickname') || '小明'
  userInfo.value.nickname = nickname
  userInfo.value.stars = uni.getStorageSync('stars') || 128
})
</script>

<style lang="scss" scoped>
.index-page {
  min-height: 100vh;
  background: $bg-child;
  padding: 0 0 $spacing-lg;
}

/* 顶部欢迎 */
.welcome-section {
  padding: calc(#{$spacing-xl} + constant(safe-area-inset-top)) $spacing-lg $spacing-lg;
  padding: calc(#{$spacing-xl} + env(safe-area-inset-top)) $spacing-lg $spacing-lg;
  background: $gradient-hero;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 0 0 $radius-xl $radius-xl;
}

.welcome-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.greeting-text {
  font-size: 26rpx;
  color: rgba(255,255,255,0.85);
}

.user-name {
  font-size: 44rpx;
  font-weight: 700;
  color: $text-white;
  line-height: 1.2;
}

.welcome-sub {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 6rpx;
}

.stars-display {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  padding: 12rpx 20rpx;
  border-radius: $radius-full;
  border: 1rpx solid rgba(255,255,255,0.3);

  .stars-icon { font-size: 32rpx; }
  .stars-count {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-white;
  }
}

/* 打卡卡片 */
.hero-section {
  padding: 0 $spacing-lg;
  margin-top: -$radius-lg;
}

.checkin-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkin-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.frog-mini {
  flex-shrink: 0;
}

.checkin-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.streak-row {
  display: flex;
  align-items: baseline;
  gap: $spacing-xs;
}

.streak-fire { font-size: 32rpx; }
.streak-days {
  font-size: 40rpx;
  font-weight: 800;
  color: $brand-orange;
}
.streak-unit {
  font-size: 26rpx;
  color: $text-secondary;
}

.today-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.progress-label {
  font-size: 24rpx;
  color: $text-secondary;
}

.progress-bar-sm {
  height: 8rpx;
  background: $border-light;
  border-radius: $radius-full;
  overflow: hidden;
  width: 200rpx;

  .progress-fill {
    height: 100%;
    background: $gradient-btn;
    border-radius: $radius-full;
    transition: width 0.4s ease-out;
  }
}

.checkin-btn {
  background: $gradient-btn;
  color: $text-white;
  font-size: 26rpx;
  font-weight: 600;
  padding: 14rpx 24rpx;
  border-radius: $radius-full;
  box-shadow: 0 4rpx 12rpx rgba(123, 198, 126, 0.3);
  -webkit-tap-highlight-color: transparent;
}

/* 场景选择区 */
.scenes-section {
  padding: $spacing-xl $spacing-lg 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
}

.section-more {
  font-size: 26rpx;
  color: $brand-blue;
  font-weight: 500;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

/* 快捷入口 */
.quick-actions {
  padding: $spacing-xl $spacing-lg 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.action-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  box-shadow: $shadow-sm;
  position: relative;
  -webkit-tap-highlight-color: transparent;

  &.primary {
    background: linear-gradient(135deg, #FFF7E6 0%, #FFF 100%);
    border-left: 6rpx solid $brand-orange;
  }

  &.secondary {
    background: linear-gradient(135deg, #F3F0FF 0%, #FFF 100%);
    border-left: 6rpx solid $brand-purple;
  }

  &.tertiary {
    background: linear-gradient(135deg, #F0F9FF 0%, #FFF 100%);
    border-left: 6rpx solid $brand-blue;
  }
}

.action-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-md;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon { font-size: 40rpx; }

.action-texts {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
}

.action-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.action-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

.action-badge {
  width: 40rpx;
  height: 40rpx;
  background: $brand-orange;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .badge-num {
    font-size: 24rpx;
    font-weight: 700;
    color: white;
  }
}

/* TabBar占位 */
.tabbar-placeholder {
  height: calc(100rpx + constant(safe-area-inset-bottom));
  height: calc(100rpx + env(safe-area-inset-bottom));
}
</style>
