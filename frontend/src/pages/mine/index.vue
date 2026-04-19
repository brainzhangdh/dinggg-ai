<!-- 顶呱呱AI宝 - 我的页面 -->
<template>
  <view class="mine-page">
    <!-- 顶部用户信息卡片 -->
    <view class="profile-card">
      <view class="profile-bg">
        <view class="bg-deco left"></view>
        <view class="bg-deco right"></view>
      </view>
      <view class="profile-content">
        <view class="avatar-wrap" @tap="changeAvatar">
          <image
            :src="userInfo.avatar || '/static/default-avatar.png'"
            class="avatar-img"
            mode="aspectFill"
          />
          <view class="avatar-edit-icon">✏️</view>
        </view>
        <view class="profile-info">
          <text class="user-name">{{ userInfo.nickname || '小小英语家' }}</text>
          <view class="user-badges">
            <view class="level-badge">
              <text class="level-icon">🌟</text>
              <text class="level-text">{{ userInfo.level || '英语小白' }}</text>
            </view>
            <view class="vip-badge" v-if="isVip">
              <text class="vip-icon">👑</text>
              <text class="vip-text">年度会员</text>
            </view>
          </view>
        </view>
        <view class="profile-stars" @tap="showStarsDetail">
          <text class="stars-icon">⭐</text>
          <text class="stars-count">{{ userInfo.stars || 0 }}</text>
          <text class="stars-label">星星</text>
        </view>
      </view>
    </view>

    <!-- 学习数据摘要 -->
    <view class="learning-summary">
      <view class="summary-item">
        <text class="summary-num">{{ summaryData.totalDays }}</text>
        <text class="summary-label">学习天数</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-num">{{ summaryData.totalMinutes }}</text>
        <text class="summary-label">总练习时长</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-num">{{ summaryData.totalSessions }}</text>
        <text class="summary-label">完成场次</text>
      </view>
    </view>

    <!-- 成就徽章区 -->
    <view class="achievement-section">
      <view class="section-header">
        <text class="section-title">🏆 我的成就</text>
        <text class="section-more" @tap="goToAllAchievements">查看全部 ></text>
      </view>
      <scroll-view class="badges-scroll" scroll-x :show-scrollbar="false">
        <view class="badges-row">
          <StarBadge
            v-for="badge in displayBadges"
            :key="badge.id"
            type="badge"
            :icon="badge.icon"
            :level="badge.level"
            :earned="badge.earned"
            :showLabel="true"
            size="sm"
            @tap="showBadgeDetail(badge)"
          />
        </view>
      </scroll-view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-section">
      <view class="menu-group">
        <!-- 订阅会员 -->
        <view class="menu-item vip-item" @tap="goToVip">
          <view class="menu-left">
            <view class="menu-icon-wrap orange">
              <text class="menu-icon">👑</text>
            </view>
            <view class="menu-texts">
              <text class="menu-title">订阅会员</text>
              <text class="menu-desc">{{ isVip ? '年度会员有效期至 2027-04-18' : '开通即可解锁全部场景' }}</text>
            </view>
          </view>
          <view class="menu-right">
            <view v-if="!isVip" class="vip-promo-tag">
              <text>首月¥1</text>
            </view>
            <text class="menu-arrow">></text>
          </view>
        </view>

        <view class="menu-divider"></view>

        <!-- 会员权益 -->
        <view class="menu-item" @tap="goToVip">
          <view class="menu-left">
            <view class="menu-icon-wrap blue">
              <text class="menu-icon">✨</text>
            </view>
            <text class="menu-title">会员权益</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="goToDailyTask">
          <view class="menu-left">
            <view class="menu-icon-wrap green">
              <text class="menu-icon">📋</text>
            </view>
            <text class="menu-title">每日任务</text>
          </view>
          <view class="menu-right">
            <text class="menu-badge" v-if="pendingTasks > 0">{{ pendingTasks }}</text>
            <text class="menu-arrow">></text>
          </view>
        </view>

        <view class="menu-divider"></view>

        <view class="menu-item" @tap="goToLearningReport">
          <view class="menu-left">
            <view class="menu-icon-wrap purple">
              <text class="menu-icon">📊</text>
            </view>
            <text class="menu-title">学习报告</text>
          </view>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-divider"></view>

        <view class="menu-item" @tap="goToRecordings">
          <view class="menu-left">
            <view class="menu-icon-wrap blue">
              <text class="menu-icon">🎧</text>
            </view>
            <text class="menu-title">历史录音</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="goToSettings">
          <view class="menu-left">
            <view class="menu-icon-wrap gray">
              <text class="menu-icon">⚙️</text>
            </view>
            <text class="menu-title">设置</text>
          </view>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-divider"></view>

        <view class="menu-item" @tap="goToHelp">
          <view class="menu-left">
            <view class="menu-icon-wrap gray">
              <text class="menu-icon">❓</text>
            </view>
            <text class="menu-title">帮助与反馈</text>
          </view>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-divider"></view>

        <view class="menu-item" @tap="goToAbout">
          <view class="menu-left">
            <view class="menu-icon-wrap gray">
              <text class="menu-icon">ℹ️</text>
            </view>
            <text class="menu-title">关于我们</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-btn" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>

    <!-- TabBar占位 -->
    <view class="tabbar-placeholder" />

    <!-- 徽章详情弹窗 -->
    <view v-if="showBadgeModal" class="modal-overlay" @tap="closeBadgeModal">
      <view class="badge-modal" @tap.stop>
        <StarBadge
          type="badge"
          :icon="selectedBadge?.icon"
          :level="selectedBadge?.level"
          :earned="selectedBadge?.earned"
          showLabel
          size="lg"
        />
        <text class="badge-modal-title">{{ selectedBadge?.name }}</text>
        <text class="badge-modal-desc">{{ selectedBadge?.description }}</text>
        <view v-if="!selectedBadge?.earned" class="badge-modal-progress">
          <view class="mini-progress">
            <view class="mini-fill" :style="{ width: (selectedBadge?.progress || 0) + '%' }"></view>
          </view>
          <text class="progress-tip">还需 {{ selectedBadge?.remaining || 0 }} 即可获得</text>
        </view>
        <view class="btn btn-primary btn-sm mt-md" @tap="closeBadgeModal">我知道了</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StarBadge from '@/components/StarBadge/StarBadge.vue'

const userInfo = ref({
  nickname: '',
  avatar: '',
  stars: 128,
  level: '英语小达人'
})

const isVip = ref(false)
const pendingTasks = ref(2)

const summaryData = ref({
  totalDays: 23,
  totalMinutes: 480,
  totalSessions: 45
})

const displayBadges = ref([
  { id: 1, icon: '🎯', level: 'bronze', name: '初次开口', description: '完成第一次英语对话', earned: true, progress: 100, remaining: 0 },
  { id: 2, icon: '🔥', level: 'silver', name: '连续7天', description: '连续打卡7天', earned: true, progress: 100, remaining: 0 },
  { id: 3, icon: '🌟', level: 'gold', name: '开口达人', description: '累计开口100次', earned: true, progress: 100, remaining: 0 },
  { id: 4, icon: '🏆', level: 'platinum', name: '学习之星', description: '获得500颗星星', earned: false, progress: 70, remaining: 150 },
  { id: 5, icon: '💎', level: 'diamond', name: '口语达人', description: '完成所有场景学习', earned: false, progress: 40, remaining: 6 },
  { id: 6, icon: '🎓', level: 'gold', name: '毕业啦', description: '完成30天学习', earned: false, progress: 76, remaining: 7 }
])

const showBadgeModal = ref(false)
const selectedBadge = ref(null)

function changeAvatar() {
  uni.showActionSheet({
    itemList: ['从相册选择', '拍照'],
    success: (res) => {
      const sourceType = res.tapIndex === 0 ? ['album'] : ['camera']
      uni.chooseImage({
        count: 1,
        sourceType,
        success: (imgRes) => {
          userInfo.value.avatar = imgRes.tempFilePaths[0]
          uni.showToast({ title: '头像已更新', icon: 'success' })
        }
      })
    }
  })
}

function showStarsDetail() {
  uni.showModal({
    title: '我的星星',
    content: `当前拥有 ${userInfo.value.stars} 颗星星\n可用来解锁道具和特殊场景～`,
    showCancel: false,
    confirmText: '知道了'
  })
}

function showBadgeDetail(badge) {
  selectedBadge.value = badge
  showBadgeModal.value = true
}

function closeBadgeModal() {
  showBadgeModal.value = false
  selectedBadge.value = null
}

function goToAllAchievements() {
  uni.showToast({ title: '全部成就（待接入）', icon: 'none' })
}

function goToVip() {
  uni.navigateTo({ url: '/pages/vip/index' })
}

function goToDailyTask() {
  uni.navigateTo({ url: '/pages/task/index' })
}

function goToLearningReport() {
  uni.navigateTo({ url: '/pages/report/index' })
}

function goToRecordings() {
  uni.showToast({ title: '历史录音（待接入）', icon: 'none' })
}

function goToSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function goToHelp() {
  uni.showToast({ title: '帮助与反馈（待接入）', icon: 'none' })
}

function goToAbout() {
  uni.showModal({
    title: '顶呱呱AI宝',
    content: '版本 1.0.0\n学好英语少不了 📣\n\n一款专为6-18岁孩子设计的AI英语口语陪练小程序',
    showCancel: false,
    confirmText: '知道了'
  })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmText: '确定退出',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

onMounted(() => {
  userInfo.value.nickname = uni.getStorageSync('nickname') || '小明'
  userInfo.value.avatar = uni.getStorageSync('avatar') || ''
  userInfo.value.stars = uni.getStorageSync('stars') || 128
})
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: $bg-child;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

/* 用户卡片 */
.profile-card {
  position: relative;
  background: $gradient-hero;
  padding: calc(#{$spacing-xl} + constant(safe-area-inset-top)) $spacing-lg $spacing-lg;
  padding: calc(#{$spacing-xl} + env(safe-area-inset-top)) $spacing-lg $spacing-lg;
  overflow: hidden;
}

.profile-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-deco {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;

  &.left {
    width: 300rpx;
    height: 300rpx;
    background: white;
    top: -100rpx;
    left: -100rpx;
  }

  &.right {
    width: 200rpx;
    height: 200rpx;
    background: white;
    bottom: -60rpx;
    right: -40rpx;
  }
}

.profile-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.3);
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background: white;
  border-radius: 50%;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-xs;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.user-name {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-white;
}

.user-badges {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.level-badge, .vip-badge {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  padding: 4rpx 14rpx;
  border-radius: $radius-full;
  border: 1rpx solid rgba(255,255,255,0.3);

  .level-icon, .vip-icon { font-size: 22rpx; }
  .level-text, .vip-text {
    font-size: 22rpx;
    color: $text-white;
    font-weight: 500;
  }
}

.vip-badge {
  background: linear-gradient(135deg, rgba(249,200,70,0.4), rgba(251,146,60,0.4));
}

.profile-stars {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  background: rgba(255,255,255,0.2);
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-lg;
  -webkit-tap-highlight-color: transparent;

  .stars-icon { font-size: 36rpx; }
  .stars-count {
    font-size: 36rpx;
    font-weight: 800;
    color: $text-white;
    line-height: 1;
  }
  .stars-label {
    font-size: 20rpx;
    color: rgba(255,255,255,0.8);
  }
}

/* 学习数据摘要 */
.learning-summary {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: $bg-card;
  margin: 0 $spacing-lg;
  margin-top: -$radius-lg;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  position: relative;
  z-index: 2;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;

  .summary-num {
    font-size: 44rpx;
    font-weight: 800;
    color: $brand-blue;
    line-height: 1;
  }

  .summary-label {
    font-size: 24rpx;
    color: $text-secondary;
  }
}

.summary-divider {
  width: 1rpx;
  height: 60rpx;
  background: $border-light;
}

/* 成就区 */
.achievement-section {
  padding: $spacing-xl $spacing-lg $spacing-md;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
}

.section-more {
  font-size: 26rpx;
  color: $brand-blue;
}

.badges-scroll {
  width: 100%;
}

.badges-row {
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-xs 0;
}

/* 功能列表 */
.menu-section {
  padding: 0 $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.menu-group {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  -webkit-tap-highlight-color: transparent;

  &.vip-item {
    background: linear-gradient(135deg, #FFFBEB 0%, #FFF 100%);
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex: 1;
}

.menu-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.orange { background: #FFF3E0; }
  &.blue { background: #EBF5FF; }
  &.green { background: #F0FFF4; }
  &.purple { background: #F3F0FF; }
  &.gray { background: #F5F7FA; }

  .menu-icon { font-size: 32rpx; }
}

.menu-texts {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.menu-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.menu-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.menu-badge {
  background: $brand-orange;
  color: white;
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
  min-width: 36rpx;
  text-align: center;
}

.vip-promo-tag {
  background: $brand-orange;
  color: white;
  font-size: 22rpx;
  font-weight: 600;
  padding: 4rpx 14rpx;
  border-radius: $radius-full;
}

.menu-arrow {
  font-size: 28rpx;
  color: $text-hint;
}

.menu-divider {
  height: 1rpx;
  background: $border-light;
  margin-left: 80rpx;
}

/* 退出登录 */
.logout-btn {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-sm;
  margin-top: $spacing-sm;
  -webkit-tap-highlight-color: transparent;

  .logout-text {
    font-size: 30rpx;
    color: $error-color;
    font-weight: 500;
  }
}

/* TabBar占位 */
.tabbar-placeholder {
  height: calc(100rpx + constant(safe-area-inset-bottom));
  height: calc(100rpx + env(safe-area-inset-bottom));
}

/* 徽章弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}

.badge-modal {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  width: 560rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  box-shadow: $shadow-lg;
}

.badge-modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
}

.badge-modal-desc {
  font-size: 28rpx;
  color: $text-secondary;
  text-align: center;
  line-height: 1.5;
}

.badge-modal-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  align-items: center;
}

.mini-progress {
  width: 200rpx;
  height: 8rpx;
  background: $border-light;
  border-radius: $radius-full;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: $gradient-hero;
  border-radius: $radius-full;
  transition: width 0.3s;
}

.progress-tip {
  font-size: 24rpx;
  color: $text-secondary;
}

.mt-md { margin-top: $spacing-md; }
</style>
