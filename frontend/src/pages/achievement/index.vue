<!-- 顶呱呱AI宝 - 成就页面 -->
<template>
  <view class="achievement-page">
    <!-- 顶部 -->
    <view class="header">
      <text class="header-title">🏆 成就中心</text>
      <view class="total-stars">
        <text class="stars-icon">⭐</text>
        <text class="stars-num">{{ totalStars }}</text>
        <text class="stars-label">我的星星</text>
      </view>
    </view>

    <!-- 当前称号 -->
    <view class="title-card">
      <FrogCharacter size="sm" mood="celebrate" :showHat="true" />
      <view class="title-info">
        <text class="current-title">{{ currentTitle }}</text>
        <text class="title-desc">{{ titleDesc }}</text>
        <view class="title-progress">
          <view class="progress-bar-xs">
            <view class="progress-fill" :style="{ width: titleProgress + '%' }"></view>
          </view>
          <text class="progress-text">再获得 {{ remainingForNext }} 星星升级</text>
        </view>
      </view>
    </view>

    <!-- 成就分类 -->
    <view class="tabs">
      <view
        v-for="tab in achievementTabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @tap="activeTab = tab.value"
      >
        <text>{{ tab.label }}</text>
        <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
      </view>
    </view>

    <!-- 成就列表 -->
    <view class="achievement-list">
      <view
        v-for="item in filteredAchievements"
        :key="item.id"
        class="achievement-card"
        :class="{ locked: !item.earned }"
        @tap="showDetail(item)"
      >
        <view class="achievement-icon-wrap">
          <StarBadge
            type="badge"
            :icon="item.icon"
            :level="item.level"
            :earned="item.earned"
            size="md"
          />
        </view>
        <view class="achievement-info">
          <text class="achievement-name">{{ item.name }}</text>
          <text class="achievement-desc">{{ item.description }}</text>
          <view v-if="!item.earned" class="achievement-progress">
            <view class="mini-progress">
              <view class="mini-fill" :style="{ width: item.progress + '%' }"></view>
            </view>
            <text class="progress-label">{{ item.progress }}%</text>
          </view>
          <view v-else class="earned-tag">
            <text class="earned-icon">✓</text>
            <text class="earned-text">已获得</text>
          </view>
        </view>
        <text class="achievement-arrow">></text>
      </view>
    </view>

    <!-- TabBar占位 -->
    <view class="tabbar-placeholder" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FrogCharacter from '@/components/FrogCharacter/FrogCharacter.vue'
import StarBadge from '@/components/StarBadge/StarBadge.vue'

const totalStars = ref(128)
const currentTitle = ref('英语小达人')
const titleDesc = ref('继续保持，你已经很棒了！')
const titleProgress = ref(64)
const remainingForNext = ref(72)
const activeTab = ref('all')

const achievementTabs = computed(() => [
  { label: '全部', value: 'all', count: achievements.filter(a => a.earned).length },
  { label: '已获得', value: 'earned', count: achievements.filter(a => a.earned).length },
  { label: '进行中', value: 'inprogress', count: achievements.filter(a => !a.earned).length }
])

const achievements = ref([
  { id: 1, icon: '🎯', level: 'bronze', name: '初次开口', description: '完成第一次英语对话', earned: true, category: 'starter', progress: 100 },
  { id: 2, icon: '🔥', level: 'silver', name: '连续7天', description: '连续打卡7天', earned: true, category: 'streak', progress: 100 },
  { id: 3, icon: '🌟', level: 'gold', name: '开口达人', description: '累计开口100次', earned: true, category: 'master', progress: 100 },
  { id: 4, icon: '🏆', level: 'platinum', name: '学习之星', description: '获得500颗星星', earned: false, category: 'milestone', progress: 70 },
  { id: 5, icon: '💎', level: 'diamond', name: '口语达人', description: '完成所有场景学习', earned: false, category: 'master', progress: 40 },
  { id: 6, icon: '🎓', level: 'gold', name: '毕业啦', description: '完成30天学习', earned: false, category: 'streak', progress: 76 },
  { id: 7, icon: '🚀', level: 'silver', name: '早起鸟', description: '早上7点前完成练习', earned: true, category: 'special', progress: 100 },
  { id: 8, icon: '🌙', level: 'bronze', name: '夜猫子', description: '晚上9点后完成练习', earned: false, category: 'special', progress: 20 },
  { id: 9, icon: '🎯', level: 'gold', name: '精准发音', description: '单次对话获得5次满分', earned: false, category: 'master', progress: 60 }
])

const filteredAchievements = computed(() => {
  if (activeTab.value === 'earned') return achievements.value.filter(a => a.earned)
  if (activeTab.value === 'inprogress') return achievements.value.filter(a => !a.earned)
  return achievements.value
})

function showDetail(item) {
  uni.showModal({
    title: item.name,
    content: item.description + (item.earned ? '\n\n🎉 已达成！' : `\n\n进度：${item.progress}%`),
    showCancel: false,
    confirmText: '知道了'
  })
}

onMounted(() => {
  totalStars.value = uni.getStorageSync('stars') || 128
})
</script>

<style lang="scss" scoped>
.achievement-page {
  min-height: 100vh;
  background: $bg-child;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.header {
  padding: calc(#{$spacing-lg} + constant(safe-area-inset-top)) $spacing-lg $spacing-md;
  padding: calc(#{$spacing-lg} + env(safe-area-inset-top)) $spacing-lg $spacing-md;
  background: linear-gradient(135deg, #A78BFA 0%, #5BA4F5 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-white;
}

.total-stars {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: rgba(255,255,255,0.2);
  padding: 10rpx 20rpx;
  border-radius: $radius-full;

  .stars-icon { font-size: 28rpx; }
  .stars-num {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-white;
  }
  .stars-label {
    font-size: 24rpx;
    color: rgba(255,255,255,0.85);
  }
}

/* 称号卡片 */
.title-card {
  margin: $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  box-shadow: $shadow-sm;
}

.title-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.current-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $brand-purple;
}

.title-desc {
  font-size: 26rpx;
  color: $text-secondary;
}

.title-progress {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-xs;
}

.progress-bar-xs {
  flex: 1;
  height: 8rpx;
  background: $border-light;
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $gradient-hero;
  border-radius: $radius-full;
}

.progress-text {
  font-size: 22rpx;
  color: $text-secondary;
  flex-shrink: 0;
}

/* 分类Tab */
.tabs {
  display: flex;
  padding: 0 $spacing-lg;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 24rpx;
  background: rgba(255,255,255,0.8);
  border-radius: $radius-full;
  font-size: 26rpx;
  color: $text-secondary;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;

  &.active {
    background: $brand-purple;
    color: white;
    font-weight: 600;
  }

  .tab-badge {
    background: $brand-orange;
    color: white;
    font-size: 18rpx;
    padding: 2rpx 8rpx;
    border-radius: $radius-full;
    font-weight: 600;
  }
}

/* 成就列表 */
.achievement-list {
  padding: 0 $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.achievement-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  box-shadow: $shadow-sm;
  -webkit-tap-highlight-color: transparent;

  &.locked {
    opacity: 0.75;
  }
}

.achievement-icon-wrap {
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.achievement-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.achievement-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: 6rpx;
}

.mini-progress {
  flex: 1;
  height: 6rpx;
  background: $border-light;
  border-radius: $radius-full;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: $gradient-hero;
  border-radius: $radius-full;
}

.progress-label {
  font-size: 22rpx;
  color: $text-secondary;
  flex-shrink: 0;
}

.earned-tag {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-top: 4rpx;

  .earned-icon {
    font-size: 22rpx;
    color: $success-green;
    font-weight: 700;
  }
  .earned-text {
    font-size: 22rpx;
    color: $success-green;
  }
}

.achievement-arrow {
  font-size: 28rpx;
  color: $text-hint;
  flex-shrink: 0;
}

.tabbar-placeholder {
  height: calc(100rpx + constant(safe-area-inset-bottom));
  height: calc(100rpx + env(safe-area-inset-bottom));
}
</style>
