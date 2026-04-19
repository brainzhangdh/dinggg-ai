<!-- 星星/徽章组件 -->
<!-- 支持：星星计数、徽章展示、获得动画 -->
<template>
  <!-- 单个星星 -->
  <view v-if="type === 'star'" class="star-badge" :class="[`star-${size}`, { animate }]" @tap="$emit('tap')">
    <text class="star-char">⭐</text>
    <text v-if="count !== undefined" class="star-count">{{ displayCount }}</text>
    <!-- 获得动画 -->
    <view v-if="animate" class="star-rays">
      <view v-for="n in 8" :key="n" class="ray" :style="{ transform: `rotate(${n * 45}deg)` }"></view>
    </view>
  </view>

  <!-- 徽章 -->
  <view v-else-if="type === 'badge'" class="badge-wrapper" :class="[`badge-${level}`, `badge-${size}`]" @tap="$emit('tap')">
    <view class="badge-circle">
      <text class="badge-icon">{{ icon }}</text>
    </view>
    <text v-if="showLabel" class="badge-label">{{ label }}</text>
    <!-- 已获得 -->
    <view v-if="earned" class="earned-mark">✓</view>
    <!-- 未获得（锁定） -->
    <view v-else-if="!earned" class="lock-overlay">
      <text class="lock-icon">🔒</text>
    </view>
  </view>

  <!-- 连续打卡徽章 -->
  <view v-else-if="type === 'streak'" class="streak-badge" :class="[`streak-${size}`]" @tap="$emit('tap')">
    <view class="streak-flame">🔥</view>
    <view class="streak-info">
      <text class="streak-count">{{ streakDays }}</text>
      <text class="streak-label">天连续</text>
    </view>
    <view v-if="streakDays >= 7" class="streak-medal">🏅</view>
  </view>

  <!-- 进度徽章（带环形进度） -->
  <view v-else-if="type === 'progress'" class="progress-badge" :class="[`badge-${size}`]">
    <view class="progress-ring">
      <svg class="ring-svg" viewBox="0 0 100 100">
        <!-- 背景环 -->
        <circle
          class="ring-bg"
          cx="50" cy="50"
          :r="ringRadius}"
          fill="none"
          stroke="#E2E8F0"
          stroke-width="8"
        />
        <!-- 进度环 -->
        <circle
          class="ring-progress"
          cx="50" cy="50"
          :r="ringRadius"
          fill="none"
          :stroke="progressColor"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="`${progressDash} ${ringCircumference}`"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <view class="ring-center">
        <text class="ring-icon">{{ icon }}</text>
      </view>
    </view>
    <text v-if="showLabel" class="progress-label">{{ label }}</text>
    <text v-if="showValue" class="progress-value">{{ value }}/{{ max }}</text>
  </view>

  <!-- 星星收集（展示组） -->
  <view v-else-if="type === 'stars-collection'" class="stars-collection">
    <view
      v-for="(star, idx) in stars"
      :key="idx"
      class="collection-star"
      :class="{ filled: idx < filledCount, animate: idx === filledCount - 1 && animate }"
      @tap="$emit('star-tap', idx)"
    >
      <text class="col-star-icon">{{ idx < filledCount ? '⭐' : '☆' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'star',
    validator: v => ['star', 'badge', 'streak', 'progress', 'stars-collection'].includes(v)
  },
  // 星星相关
  count: { type: Number, default: undefined },
  animate: { type: Boolean, default: false },
  // 徽章相关
  level: { type: String, default: 'bronze', validator: v => ['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(v) },
  icon: { type: String, default: '🏆' },
  label: { type: String, default: '' },
  earned: { type: Boolean, default: true },
  showLabel: { type: Boolean, default: false },
  // 连续打卡
  streakDays: { type: Number, default: 0 },
  // 进度徽章
  value: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  progressColor: { type: String, default: '#7BC67E' },
  showValue: { type: Boolean, default: false },
  // 星星组
  stars: { type: Number, default: 5 },
  filledCount: { type: Number, default: 0 },
  // 尺寸
  size: { type: String, default: 'md', validator: v => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v) }
})

defineEmits(['tap', 'star-tap'])

// 动画计数
const displayCount = ref(props.count || 0)

watch(() => props.count, (newVal, oldVal) => {
  if (props.animate && newVal !== undefined && oldVal !== undefined) {
    // 数字跳动动画
    let start = oldVal
    const end = newVal
    const step = end > start ? 1 : -1
    const timer = setInterval(() => {
      start += step
      displayCount.value = start
      if (start === end) clearInterval(timer)
    }, 100)
  } else {
    displayCount.value = newVal
  }
})

// 进度环
const ringRadius = 42
const ringCircumference = computed(() => 2 * Math.PI * ringRadius)
const progressDash = computed(() => {
  const percent = Math.min(props.value / props.max, 1)
  return ringCircumference.value * percent
})
</script>

<style lang="scss" scoped">
/* ---- 单星 ---- */
.star-badge {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  position: relative;

  &.animate {
    animation: star-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    .star-rays {
      display: block;
    }
  }

  &.star-xs { .star-char { font-size: 28rpx; } .star-count { font-size: 22rpx; } }
  &.star-sm { .star-char { font-size: 36rpx; } .star-count { font-size: 26rpx; } }
  &.star-md { .star-char { font-size: 48rpx; } .star-count { font-size: 30rpx; } }
  &.star-lg { .star-char { font-size: 64rpx; } .star-count { font-size: 36rpx; } }
  &.star-xl { .star-char { font-size: 80rpx; } .star-count { font-size: 42rpx; } }
}

.star-char {
  display: inline-block;
  filter: drop-shadow(0 0 6rpx rgba(249, 200, 70, 0.6));
}

.star-count {
  color: #B7791F;
  font-weight: 700;
}

.star-rays {
  display: none;
  position: absolute;
  inset: -16rpx;
  pointer-events: none;

  .ray {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4rpx;
    height: 16rpx;
    background: $brand-yellow;
    border-radius: 2rpx;
    transform-origin: center -8rpx;
    animation: ray-fade 0.6s ease-out forwards;
    opacity: 0;
  }
}

@keyframes star-pop {
  0% { transform: scale(0) rotate(-30deg); opacity: 0; }
  60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
  80% { transform: scale(0.9) rotate(-5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes ray-fade {
  0% { opacity: 1; transform: scaleY(1); }
  100% { opacity: 0; transform: scaleY(0.3); }
}

/* ---- 徽章 ---- */
.badge-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  position: relative;

  &.badge-xs { .badge-circle { width: 60rpx; height: 60rpx; } .badge-icon { font-size: 28rpx; } .badge-label { font-size: 18rpx; } }
  &.badge-sm { .badge-circle { width: 80rpx; height: 80rpx; } .badge-icon { font-size: 36rpx; } .badge-label { font-size: 22rpx; } }
  &.badge-md { .badge-circle { width: 100rpx; height: 100rpx; } .badge-icon { font-size: 48rpx; } .badge-label { font-size: 26rpx; } }
  &.badge-lg { .badge-circle { width: 140rpx; height: 140rpx; } .badge-icon { font-size: 64rpx; } .badge-label { font-size: 30rpx; } }

  &.badge-bronze .badge-circle { background: linear-gradient(135deg, #CD7F32, #E8A87C); }
  &.badge-silver .badge-circle { background: linear-gradient(135deg, #C0C0C0, #E8E8E8); }
  &.badge-gold .badge-circle { background: linear-gradient(135deg, #FFD700, #FFA500); box-shadow: 0 0 20rpx rgba(255, 215, 0, 0.4); }
  &.badge-platinum .badge-circle { background: linear-gradient(135deg, #E5E4E2, #A8D8EA); }
  &.badge-diamond .badge-circle { background: linear-gradient(135deg, #B9F2FF, #7B68EE, #FF69B4); box-shadow: 0 0 24rpx rgba(135, 206, 250, 0.5); }
}

.badge-circle {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-sm;
  position: relative;
}

.badge-icon {
  position: relative;
  z-index: 1;
}

.badge-label {
  color: $text-secondary;
  font-weight: 500;
  text-align: center;
}

.earned-mark {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 28rpx;
  height: 28rpx;
  background: $success-green;
  color: white;
  border-radius: 50%;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid white;
  z-index: 3;
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  .lock-icon { font-size: 28rpx; opacity: 0.5; }
}

/* ---- 连续打卡 ---- */
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  background: linear-gradient(135deg, #FF6B35, #FF9A76);
  border-radius: $radius-full;
  padding: $spacing-sm $spacing-lg;
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 53, 0.3);

  &.streak-sm { padding: $spacing-xs $spacing-md; .streak-flame { font-size: 32rpx; } .streak-count { font-size: 32rpx; } }
  &.streak-md { padding: $spacing-sm $spacing-lg; .streak-flame { font-size: 40rpx; } .streak-count { font-size: 40rpx; } }
  &.streak-lg { padding: $spacing-md $spacing-xl; .streak-flame { font-size: 56rpx; } .streak-count { font-size: 56rpx; } }
}

.streak-flame {
  font-size: 40rpx;
  animation: flame-flicker 0.5s ease-in-out infinite alternate;
}

@keyframes flame-flicker {
  from { transform: scale(1) rotate(-3deg); }
  to { transform: scale(1.05) rotate(3deg); }
}

.streak-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.streak-count {
  font-size: 40rpx;
  font-weight: 800;
  color: $text-white;
  line-height: 1;
}

.streak-label {
  font-size: 22rpx;
  color: rgba(255,255,255,0.85);
}

.streak-medal {
  font-size: 32rpx;
  margin-left: $spacing-xs;
}

/* ---- 进度环 ---- */
.progress-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;

  &.badge-sm { .progress-ring { width: 80rpx; height: 80rpx; } .ring-icon { font-size: 28rpx; } }
  &.badge-md { .progress-ring { width: 120rpx; height: 120rpx; } .ring-icon { font-size: 40rpx; } }
  &.badge-lg { .progress-ring { width: 160rpx; height: 160rpx; } .ring-icon { font-size: 56rpx; } }
}

.progress-ring {
  position: relative;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.ring-progress {
  transition: stroke-dasharray 0.4s ease-out;
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-icon {
  font-size: 40rpx;
}

.progress-label {
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 500;
}

.progress-value {
  font-size: 24rpx;
  color: $text-secondary;
}

/* ---- 星星收集组 ---- */
.stars-collection {
  display: inline-flex;
  gap: $spacing-xs;
}

.collection-star {
  transition: all 0.2s;

  &.animate {
    animation: star-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  &.filled {
    .col-star-icon {
      color: $brand-yellow;
      filter: drop-shadow(0 0 4rpx rgba(249, 200, 70, 0.5));
    }
  }

  &:not(.filled) {
    .col-star-icon { color: #CBD5E0; }
  }
}

.col-star-icon {
  font-size: 40rpx;
  transition: all 0.2s;
}
</style>
