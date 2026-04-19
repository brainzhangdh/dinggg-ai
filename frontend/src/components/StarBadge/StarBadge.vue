<template>
  <view v-if="type === 'star'" class="star-badge" :class="['star-' + size, { animate: animate }]" @tap="$emit('tap')">
    <text class="star-char">⭐</text>
    <text v-if="count !== undefined" class="star-count">{{ displayCount }}</text>
    <view v-if="animate" class="star-rays">
      <view v-for="n in 8" :key="n" class="ray" :style="{ transform: getRayTransform(n) }"></view>
    </view>
  </view>
  <view v-else-if="type === 'badge'" class="badge-wrapper" :class="['badge-' + level, 'badge-' + size]" @tap="$emit('tap')">
    <view class="badge-circle">
      <text class="badge-icon">{{ icon }}</text>
    </view>
    <text v-if="showLabel" class="badge-label">{{ label }}</text>
    <view v-if="earned" class="earned-mark">✓</view>
    <view v-else-if="!earned" class="lock-overlay">
      <text class="lock-icon">🔒</text>
    </view>
  </view>
  <view v-else-if="type === 'streak'" class="streak-badge" :class="['streak-' + size]" @tap="$emit('tap')">
    <view class="streak-flame">🔥</view>
    <view class="streak-info">
      <text class="streak-count">{{ streakDays }}</text>
      <text class="streak-label">天连续</text>
    </view>
    <view v-if="streakDays >= 7" class="streak-medal">🏅</view>
  </view>
  <view v-else-if="type === 'progress'" class="progress-badge" :class="['badge-' + size]">
    <view class="progress-ring">
      <svg class="ring-svg" viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" :r="ringRadius" fill="none" stroke="#E2E8F0" stroke-width="8"/>
        <circle class="ring-progress" cx="50" cy="50" :r="ringRadius" fill="none" stroke="#10B981" stroke-width="8" stroke-linecap="round" :stroke-dasharray="ringCircumference" :stroke-dashoffset="ringCircumference - progressDash"/>
      </svg>
    </view>
    <text class="progress-text">{{ value }}/{{ max }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'star' },
  size: { type: String, default: 'medium' },
  count: Number,
  animate: Boolean,
  level: String,
  icon: String,
  label: String,
  earned: Boolean,
  showLabel: Boolean,
  streakDays: Number,
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 }
})

const displayCount = computed(() => props.count || 0)
const ringRadius = 42
const ringCircumference = computed(() => 2 * Math.PI * ringRadius)
const progressDash = computed(() => {
  const percent = Math.min(props.value / props.max, 1)
  return ringCircumference.value * percent
})
const getRayTransform = (n) => 'rotate(' + (n * 45) + 'deg)'
</script>

<style lang="scss" scoped>
.star-badge { display: inline-flex; align-items: center; gap: 4rpx; position: relative; }
.star-char { font-size: 48rpx; }
.star-count { font-size: 28rpx; color: #666; margin-left: 8rpx; }
.star-rays { position: absolute; top: -20rpx; left: 50%; transform: translateX(-50%); }
.ray { position: absolute; width: 4rpx; height: 16rpx; background: #FFD700; border-radius: 2rpx; }
.badge-wrapper { display: flex; flex-direction: column; align-items: center; }
.badge-circle { width: 80rpx; height: 80rpx; border-radius: 50%; background: #E0E7FF; display: flex; align-items: center; justify-content: center; }
.badge-icon { font-size: 40rpx; }
.badge-label { font-size: 24rpx; color: #666; margin-top: 8rpx; }
.streak-badge { display: flex; align-items: center; gap: 8rpx; }
.streak-flame { font-size: 48rpx; }
.streak-count { font-size: 32rpx; font-weight: bold; color: #FF6B35; }
.streak-label { font-size: 24rpx; color: #999; }
.progress-badge { display: flex; flex-direction: column; align-items: center; }
.progress-ring { width: 120rpx; height: 120rpx; }
.ring-svg { width: 100%; height: 100%; }
.progress-text { font-size: 24rpx; color: #666; margin-top: 8rpx; }
</style>
