<!-- 顶呱呱AI宝 - 家长监控台 -->
<template>
  <view class="parent-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-top">
        <text class="header-title">家长监控台</text>
        <view class="header-date" @tap="showDatePicker">
          <text class="date-text">{{ displayDate }}</text>
          <text class="date-icon">▼</text>
        </view>
      </view>
    </view>

    <!-- 孩子切换卡片 -->
    <view class="child-switch-card">
      <view class="child-avatar-wrap">
        <image
          :src="currentChild.avatar || '/static/default-avatar.png'"
          class="child-avatar"
          mode="aspectFill"
        />
        <view class="online-dot"></view>
      </view>
      <view class="child-info">
        <text class="child-name">{{ currentChild.name }}</text>
        <text class="child-meta">{{ currentChild.age }}岁 · {{ currentChild.grade }}</text>
        <view class="child-progress">
          <view class="progress-bar-xs">
            <view class="progress-fill-xs" :style="{ width: currentChild.learningProgress + '%' }"></view>
          </view>
          <text class="progress-pct">{{ currentChild.learningProgress }}%</text>
        </view>
      </view>
      <view class="switch-btn" @tap="showChildSwitch">
        <text class="switch-text">切换孩子</text>
        <text class="switch-icon">▼</text>
      </view>
    </view>

    <!-- 学习概览（4宫格） -->
    <view class="stats-section">
      <text class="section-title">📊 学习概览</text>
      <view class="stats-grid">
        <!-- 今日时长 -->
        <view class="stat-card">
          <view class="stat-icon-wrap orange">
            <text class="stat-icon">⏱️</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.todayMinutes }}</text>
            <text class="stat-unit">分钟</text>
            <text class="stat-label">今日时长</text>
          </view>
          <view class="stat-trend up">
            <text class="trend-arrow">↑</text>
            <text class="trend-text">{{ stats.todayMinutesChange }}%</text>
          </view>
        </view>

        <!-- 开口次数 -->
        <view class="stat-card">
          <view class="stat-icon-wrap blue">
            <text class="stat-icon">🎤</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.speakCount }}</text>
            <text class="stat-unit">次</text>
            <text class="stat-label">开口次数</text>
          </view>
          <view class="stat-trend up">
            <text class="trend-arrow">↑</text>
            <text class="trend-text">+{{ stats.speakCountChange }}</text>
          </view>
        </view>

        <!-- 连续打卡 -->
        <view class="stat-card">
          <view class="stat-icon-wrap green">
            <text class="stat-icon">🔥</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.streakDays }}</text>
            <text class="stat-unit">天</text>
            <text class="stat-label">连续打卡</text>
          </view>
          <view class="stat-trend" :class="stats.streakStatus">
            <text class="trend-arrow">{{ stats.streakStatus === 'up' ? '↑' : stats.streakStatus === 'keep' ? '—' : '↓' }}</text>
            <text class="trend-text">{{ stats.streakStatus === 'up' ? '连续中' : stats.streakStatus === 'keep' ? '持平' : '中断' }}</text>
          </view>
        </view>

        <!-- 获得徽章 -->
        <view class="stat-card">
          <view class="stat-icon-wrap purple">
            <text class="stat-icon">🏆</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.badges }}</text>
            <text class="stat-unit">枚</text>
            <text class="stat-label">获得徽章</text>
          </view>
          <view class="stat-trend up">
            <text class="trend-text">+{{ stats.newBadges }}新</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 进步曲线 -->
    <view class="curve-section">
      <view class="section-header-row">
        <text class="section-title">📈 本周进步曲线</text>
        <view class="curve-tabs">
          <view
            v-for="tab in curveTabs"
            :key="tab.value"
            class="curve-tab"
            :class="{ active: activeCurveTab === tab.value }"
            @tap="activeCurveTab = tab.value"
          >
            {{ tab.label }}
          </view>
        </view>
      </view>
      <view class="curve-card">
        <view class="curve-y-labels">
          <text v-for="label in yLabels" :key="label" class="y-label">{{ label }}</text>
        </view>
        <view class="curve-chart">
          <!-- 模拟曲线图 -->
          <view class="chart-bg-grid">
            <view v-for="n in 4" :key="n" class="grid-line"></view>
          </view>
          <view class="chart-line-wrap">
            <!-- 数据点 -->
            <view
              v-for="(point, idx) in chartPoints"
              :key="idx"
              class="chart-point"
              :style="{ left: point.x + '%', bottom: point.y + '%' }"
            >
              <view class="point-dot"></view>
              <view class="point-tooltip" v-if="activePoint === idx">
                <text class="tooltip-val">{{ point.value }}次</text>
              </view>
            </view>
            <!-- 连线svg -->
            <svg class="line-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#5BA4F5" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#5BA4F5" stop-opacity="0" />
                </linearGradient>
              </defs>
              <!-- 面积 -->
              <path :d="areaPath" fill="url(#lineGrad)" />
              <!-- 线 -->
              <path :d="linePath" fill="none" stroke="#5BA4F5" stroke-width="2" stroke-linecap="round" />
            </svg>
          </view>
          <view class="chart-x-labels">
            <text v-for="(day, idx) in weekDays" :key="idx" class="x-label" :class="{ today: idx === todayIdx }">{{ day }}</text>
          </view>
        </view>
      </view>
      <!-- AI评语 -->
      <view class="ai-comment">
        <text class="comment-icon">💡</text>
        <text class="comment-text">{{ aiComment }}</text>
      </view>
    </view>

    <!-- 近期学习记录 -->
    <view class="records-section">
      <text class="section-title">📝 近期学习记录</text>
      <view class="records-list">
        <view
          v-for="record in recentRecords"
          :key="record.id"
          class="record-item"
        >
          <view class="record-left">
            <text class="record-icon">{{ record.icon }}</text>
            <view class="record-info">
              <text class="record-scene">{{ record.sceneName }}</text>
              <text class="record-time">{{ record.time }}</text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-duration">{{ record.duration }}分钟</text>
            <view class="record-stars">
              <text class="record-star-icon">⭐</text>
              <text class="record-star-count">×{{ record.stars }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部快捷操作 -->
    <view class="bottom-actions">
      <view class="action-btn" @tap="goToSubscribe">
        <text class="action-icon">📋</text>
        <text class="action-text">订阅管理</text>
      </view>
      <view class="action-btn" @tap="setReminder">
        <text class="action-icon">⏰</text>
        <text class="action-text">学习提醒</text>
      </view>
      <view class="action-btn" @tap="giveFeedback">
        <text class="action-icon">💬</text>
        <text class="action-text">意见反馈</text>
      </view>
    </view>

    <!-- TabBar占位 -->
    <view class="tabbar-placeholder" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 当前选中孩子
const currentChild = ref({
  name: '小明',
  age: 8,
  grade: '三年级',
  avatar: '',
  learningProgress: 80
})

// 统计数据
const stats = ref({
  todayMinutes: 28,
  todayMinutesChange: 15,
  speakCount: 15,
  speakCountChange: 3,
  streakDays: 7,
  streakStatus: 'up',
  badges: 12,
  newBadges: 2
})

// 进步曲线
const curveTabs = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]
const activeCurveTab = ref('week')

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const todayIdx = ref(2)

const chartPoints = ref([
  { x: 0, y: 30, value: 5 },
  { x: 16.6, y: 45, value: 8 },
  { x: 33.3, y: 25, value: 4 },
  { x: 50, y: 60, value: 12 },
  { x: 66.6, y: 40, value: 7 },
  { x: 83.3, y: 55, value: 10 },
  { x: 100, y: 70, value: 15 }
])

const activePoint = ref(-1)

// 计算SVG路径
const linePath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const maxY = 100
  const pathPoints = pts.map((p, i) => {
    const x = p.x
    const y = maxY - p.y
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  })
  return pathPoints.join(' ')
})

const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const maxY = 100
  const pts_str = pts.map((p, i) => {
    const x = p.x
    const y = maxY - p.y
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')
  return pts_str + ` L 100 ${maxY} L 0 ${maxY} Z`
})

const yLabels = ['15次', '10次', '5次', '0次']

const aiComment = ref('小明这周口语进步明显！建议：可以多练习旅行英语场景，即将到来的五一假期可以用上哦～ 🌟')

// 日期
const displayDate = ref('2026年4月19日')

// 学习记录
const recentRecords = ref([
  { id: 1, sceneName: '看动画聊英语', icon: '📺', time: '今天 14:30', duration: 15, stars: 3 },
  { id: 2, sceneName: '交外国朋友', icon: '🤝', time: '今天 10:15', duration: 20, stars: 5 },
  { id: 3, sceneName: '学校生活', icon: '🏫', time: '昨天 20:00', duration: 12, stars: 2 },
  { id: 4, sceneName: '日常打招呼', icon: '👋', time: '昨天 19:00', duration: 10, stars: 2 }
])

function showDatePicker() {
  uni.showToast({ title: '日期选择器（待接入）', icon: 'none' })
}

function showChildSwitch() {
  uni.showToast({ title: '切换孩子（待接入）', icon: 'none' })
}

function goToSubscribe() {
  uni.navigateTo({ url: '/pages/mine/index?tab=vip' })
}

function setReminder() {
  uni.showToast({ title: '学习提醒设置（待接入）', icon: 'none' })
}

function giveFeedback() {
  uni.showToast({ title: '意见反馈（待接入）', icon: 'none' })
}

onMounted(() => {
  // 加载孩子数据
})
</script>

<style lang="scss" scoped>
.parent-page {
  min-height: 100vh;
  background: $bg-parent;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

/* 顶部导航 */
.header {
  background: $bg-parent;
  padding: calc(#{$spacing-lg} + constant(safe-area-inset-top)) $spacing-lg $spacing-md;
  padding: calc(#{$spacing-lg} + env(safe-area-inset-top)) $spacing-lg $spacing-md;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary;
}

.header-date {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  background: rgba(255,255,255,0.8);
  padding: 10rpx 20rpx;
  border-radius: $radius-full;
  -webkit-tap-highlight-color: transparent;

  .date-text {
    font-size: 26rpx;
    color: $text-secondary;
  }
  .date-icon { font-size: 20rpx; color: $text-hint; }
}

/* 孩子切换卡片 */
.child-switch-card {
  margin: 0 $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  box-shadow: $shadow-sm;
}

.child-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.child-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $border-light;
}

.online-dot {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  background: $success-green;
  border-radius: 50%;
  border: 3rpx solid white;
}

.child-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.child-name {
  font-size: 34rpx;
  font-weight: 700;
  color: $text-primary;
}

.child-meta {
  font-size: 24rpx;
  color: $text-secondary;
}

.child-progress {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: 4rpx;
}

.progress-bar-xs {
  flex: 1;
  height: 8rpx;
  background: $border-light;
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill-xs {
  height: 100%;
  background: $gradient-hero;
  border-radius: $radius-full;
  transition: width 0.4s;
}

.progress-pct {
  font-size: 22rpx;
  color: $brand-blue;
  font-weight: 600;
  flex-shrink: 0;
}

.switch-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: $spacing-sm;
  -webkit-tap-highlight-color: transparent;

  .switch-text {
    font-size: 22rpx;
    color: $brand-blue;
    font-weight: 500;
  }
  .switch-icon {
    font-size: 18rpx;
    color: $text-hint;
  }
}

/* 通用标题 */
.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-md;
}

/* 学习概览 */
.stats-section {
  padding: $spacing-lg;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.stat-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  box-shadow: $shadow-sm;
  position: relative;
}

.stat-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-xs;

  &.orange { background: #FFF3E0; }
  &.blue { background: #EBF5FF; }
  &.green { background: #F0FFF4; }
  &.purple { background: #F3F0FF; }

  .stat-icon { font-size: 32rpx; }
}

.stat-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 800;
  color: $text-primary;
  line-height: 1;
}

.stat-unit {
  font-size: 24rpx;
  color: $text-secondary;
  margin-left: 2rpx;
}

.stat-label {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 2rpx;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 22rpx;
  margin-top: 4rpx;

  &.up { color: $success-green; }
  &.down { color: $error-color; }
  &.keep { color: $text-hint; }

  .trend-arrow { font-weight: 700; }
  .trend-text { font-weight: 600; }
}

/* 进步曲线 */
.curve-section {
  padding: 0 $spacing-lg $spacing-lg;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.curve-tabs {
  display: flex;
  background: rgba(255,255,255,0.8);
  border-radius: $radius-full;
  padding: 4rpx;
}

.curve-tab {
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: $text-secondary;
  border-radius: $radius-full;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;

  &.active {
    background: $brand-blue;
    color: white;
    font-weight: 600;
  }
}

.curve-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
  display: flex;
  gap: $spacing-md;
}

.curve-y-labels {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  padding: 20rpx 0;
}

.y-label {
  font-size: 20rpx;
  color: $text-hint;
  text-align: right;
  width: 50rpx;
}

.curve-chart {
  flex: 1;
  position: relative;
  height: 300rpx;
}

.chart-bg-grid {
  position: absolute;
  inset: 20rpx 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .grid-line {
    height: 1rpx;
    background: $border-light;
  }
}

.chart-line-wrap {
  position: absolute;
  inset: 20rpx 0;
}

.line-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

.chart-point {
  position: absolute;
  transform: translate(-50%, 50%);

  .point-dot {
    width: 16rpx;
    height: 16rpx;
    background: $brand-blue;
    border-radius: 50%;
    border: 3rpx solid white;
    box-shadow: 0 2rpx 8rpx rgba(91, 164, 245, 0.5);
  }

  .point-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: $text-primary;
    color: white;
    padding: 4rpx 12rpx;
    border-radius: $radius-sm;
    font-size: 20rpx;
    white-space: nowrap;
    margin-bottom: 8rpx;
  }
}

.chart-x-labels {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 4rpx;
}

.x-label {
  font-size: 22rpx;
  color: $text-hint;

  &.today {
    color: $brand-blue;
    font-weight: 600;
  }
}

/* AI评语 */
.ai-comment {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  background: #FFFBEB;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-top: $spacing-md;
  border-left: 6rpx solid $brand-yellow;

  .comment-icon { font-size: 28rpx; flex-shrink: 0; margin-top: 2rpx; }
  .comment-text {
    font-size: 26rpx;
    color: #92400E;
    line-height: 1.6;
  }
}

/* 学习记录 */
.records-section {
  padding: 0 $spacing-lg $spacing-lg;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.record-item {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: $shadow-sm;
}

.record-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.record-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.record-scene {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.record-time {
  font-size: 24rpx;
  color: $text-secondary;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.record-duration {
  font-size: 26rpx;
  color: $text-secondary;
}

.record-stars {
  display: flex;
  align-items: center;
  gap: 4rpx;

  .record-star-icon { font-size: 22rpx; }
  .record-star-count {
    font-size: 24rpx;
    font-weight: 600;
    color: #B7791F;
  }
}

/* 底部操作 */
.bottom-actions {
  display: flex;
  justify-content: space-around;
  padding: $spacing-lg;
  margin: 0 $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  -webkit-tap-highlight-color: transparent;

  .action-icon { font-size: 40rpx; }
  .action-text {
    font-size: 24rpx;
    color: $text-secondary;
    font-weight: 500;
  }
}

.tabbar-placeholder {
  height: calc(100rpx + constant(safe-area-inset-bottom));
  height: calc(100rpx + env(safe-area-inset-bottom));
}
</style>
