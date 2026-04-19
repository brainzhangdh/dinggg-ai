<!-- 场景选择卡片组件 -->
<template>
  <view
    class="scene-card"
    :class="[`scene-${scene.id}`, { locked: scene.locked, selected: selected }]"
    :style="{ '--scene-color': scene.color || '#7BC67E' }"
    @tap="handleTap"
  >
    <!-- 锁定遮罩 -->
    <view v-if="scene.locked" class="lock-overlay">
      <text class="lock-icon">🔒</text>
      <text class="lock-text">会员专享</text>
    </view>

    <!-- 卡片主体 -->
    <view class="card-content">
      <!-- 图标区 -->
      <view class="scene-icon-wrap">
        <text class="scene-icon">{{ scene.icon }}</text>
        <view v-if="scene.tag" class="scene-tag" :class="`tag-${scene.tagType || 'default'}`">
          {{ scene.tag }}
        </view>
      </view>

      <!-- 文字区 -->
      <view class="scene-info">
        <text class="scene-name">{{ scene.name }}</text>
        <text class="scene-desc">{{ scene.description }}</text>
      </view>

      <!-- 星星/徽章 -->
      <view v-if="scene.starsCount" class="scene-stars">
        <text class="star-icon">⭐</text>
        <text class="star-count">+{{ scene.starsCount }}</text>
      </view>
    </view>

    <!-- 选中动效 -->
    <view v-if="selected" class="select-ring"></view>
  </view>
</template>

<script setup>
const props = defineProps({
  scene: {
    type: Object,
    required: true,
    default: () => ({
      id: 1,
      name: '日常打招呼',
      icon: '👋',
      description: '练习日常英语对话',
      locked: false,
      color: '#7BC67E',
      tag: '',
      tagType: 'default',
      starsCount: 0
    })
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['tap'])

function handleTap() {
  if (!props.scene.locked) {
    emit('tap', props.scene)
  } else {
    // 锁定场景点击 -> 提示开会员
    uni.showModal({
      title: '会员专享',
      content: '开通会员解锁更多场景～',
      confirmText: '去开通',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/mine/index?tab=vip' })
        }
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.scene-card {
  position: relative;
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
  transition: all 0.2s ease;
  border: 3rpx solid transparent;

  &:active {
    transform: scale(0.97);
    box-shadow: $shadow-xs;
  }

  &.selected {
    border-color: var(--scene-color);
    box-shadow: 0 0 0 6rpx rgba(var(--scene-color), 0.15);
  }

  /* 每个场景有独特配色 */
  &.scene-1 { --scene-color: #7BC67E; }   // 日常 - 绿色
  &.scene-2 { --scene-color: #5BA4F5; }   // 动画 - 蓝色
  &.scene-3 { --scene-color: #A78BFA; }  // 交朋友 - 紫色
  &.scene-4 { --scene-color: #FB923C; }  // 学校 - 橙色
  &.scene-5 { --scene-color: #38BDF8; }  // 旅行 - 天蓝
  &.scene-6 { --scene-color: #F472B6; }  // 节日 - 粉色
  &.scene-7 { --scene-color: #FBBF24; }  // 面试 - 金色
  &.scene-8 { --scene-color: #34D399; }  // 更多 - 青绿
}

.card-content {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  position: relative;
}

/* 图标区 */
.scene-icon-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.scene-icon {
  font-size: 56rpx;
  line-height: 1;
}

.scene-tag {
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
  background: var(--scene-color);
  color: $text-white;

  &.tag-new {
    background: $brand-orange;
  }

  &.tag-hot {
    background: #EF4444;
  }

  &.tag-free {
    background: $success-green;
  }
}

/* 文字区 */
.scene-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.scene-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.3;
}

.scene-desc {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 星星奖励 */
.scene-stars {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-top: 4rpx;

  .star-icon {
    font-size: 22rpx;
  }

  .star-count {
    font-size: 22rpx;
    color: #B7791F;
    font-weight: 600;
  }
}

/* 锁定遮罩 */
.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(4rpx);
  -webkit-backdrop-filter: blur(4rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  z-index: 2;

  .lock-icon {
    font-size: 48rpx;
    opacity: 0.7;
  }

  .lock-text {
    font-size: 24rpx;
    color: $text-secondary;
    font-weight: 500;
  }
}

/* 选中动效环 */
.select-ring {
  position: absolute;
  inset: -4rpx;
  border: 4rpx solid var(--scene-color);
  border-radius: $radius-lg + 4rpx;
  animation: ring-pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.02); }
}
</style>
