<!-- 呱呱吉祥物组件 -->
<!-- 卡通版绿色小青蛙，会说英语的小老师 -->
<template>
  <view class="frog-wrapper" :class="[`size-${size}`, `mood-${mood}`]" @tap="$emit('tap')">
    <!-- 身体 -->
    <view class="frog-body">
      <!-- 头部 -->
      <view class="frog-head">
        <!-- 左眼 -->
        <view class="frog-eye left">
          <view class="eye-white">
            <view class="eye-pupil"></view>
            <view class="eye-highlight"></view>
          </view>
        </view>
        <!-- 右眼 -->
        <view class="frog-eye right">
          <view class="eye-white">
            <view class="eye-pupil"></view>
            <view class="eye-highlight"></view>
          </view>
        </view>
        <!-- 腮红 -->
        <view class="frog-blush left"></view>
        <view class="frog-blush right"></view>
        <!-- 嘴巴 -->
        <view class="frog-mouth" :class="mouthClass"></view>
      </view>
      <!-- 肚子 -->
      <view class="frog-belly"></view>
      <!-- 小皇冠/博士帽 -->
      <view v-if="showHat" class="frog-hat">
        <text class="hat-emoji">🎓</text>
      </view>
    </view>
    <!-- 手臂（激动时） -->
    <view v-if="mood === 'excited' || mood === 'celebrate'" class="frog-arm left"></view>
    <view v-if="mood === 'excited' || mood === 'celebrate'" class="frog-arm right"></view>
    <!-- 对话气泡 -->
    <view v-if="showBubble && bubbleText" class="frog-bubble">
      <text class="bubble-text">{{ bubbleText }}</text>
      <view class="bubble-tail"></view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 尺寸: xs=40rpx, sm=80rpx, md=120rpx, lg=160rpx, xl=200rpx
  size: {
    type: String,
    default: 'md'
  },
  // 情绪表情
  mood: {
    type: String,
    default: 'happy',
    validator: v => ['happy', 'excited', 'encourage', 'curious', 'celebrate', 'tired', 'sleepy'].includes(v)
  },
  // 是否显示帽子
  showHat: {
    type: Boolean,
    default: false
  },
  // 是否显示对话气泡
  showBubble: {
    type: Boolean,
    default: false
  },
  // 气泡文字
  bubbleText: {
    type: String,
    default: ''
  },
  // 是否摆动（动画）
  wiggle: {
    type: Boolean,
    default: false
  }
})

defineEmits(['tap'])

const mouthClass = computed(() => {
  const map = {
    happy: 'smile',
    excited: 'big-smile',
    encourage: 'smile',
    curious: 'oh',
    celebrate: 'big-smile',
    tired: 'straight',
    sleepy: 'sleepy'
  }
  return map[props.mood] || 'smile'
})
</script>

<style lang="scss" scoped>
/* 尺寸映射 */
$frog-sizes: (
  'xs': 80rpx,
  'sm': 120rpx,
  'md': 160rpx,
  'lg': 200rpx,
  'xl': 280rpx
);

/* 情绪颜色 */
$frog-body-color: #7BC67E;
$frog-belly-color: #FFF9E6;
$frog-eye-white: #FFFFFF;
$frog-pupil: #2D3748;

@mixin frog-size($size) {
  $h: map-get($frog-sizes, $size);
  .frog-body {
    width: $h;
    height: $h * 0.9;
  }
  .frog-head {
    width: $h * 0.85;
    height: $h * 0.65;
  }
  .frog-eye {
    width: $h * 0.26;
    height: $h * 0.26;
    top: $h * 0.12;
    .eye-white {
      width: 100%;
      height: 100%;
    }
    .eye-pupil {
      width: 60%;
      height: 60%;
    }
    .eye-highlight {
      width: 20%;
      height: 20%;
    }
  }
  .frog-eye.left { left: $h * 0.1; }
  .frog-eye.right { right: $h * 0.1; }

  .frog-blush {
    width: $h * 0.14;
    height: $h * 0.07;
  }
  .frog-blush.left { left: $h * 0.06; }
  .frog-blush.right { right: $h * 0.06; }

  .frog-mouth {
    bottom: $h * 0.12;
    &.smile { border-radius: 0 0 $h * 0.2 $h * 0.2; }
    &.big-smile { border-radius: 0 0 $h * 0.25 $h * 0.25; }
    &.oh { border-radius: 50%; width: $h * 0.12; height: $h * 0.12; }
    &.straight { height: 4rpx; border-radius: 4rpx; }
    &.sleepy { border-radius: 0 0 $h * 0.15 $h * 0.15; opacity: 0.7; }
  }

  .frog-belly {
    width: $h * 0.5;
    height: $h * 0.3;
    bottom: $h * 0.05;
  }

  .frog-hat {
    top: -#{$h * 0.08};
    .hat-emoji { font-size: $h * 0.22; }
  }

  .frog-arm {
    width: $h * 0.15;
    height: $h * 0.3;
  }
}

.frog-wrapper {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;

  &.size-xs { @include frog-size(xs); }
  &.size-sm { @include frog-size(sm); }
  &.size-md { @include frog-size(md); }
  &.size-lg { @include frog-size(lg); }
  &.size-xl { @include frog-size(xl); }

  &.mood-excited, &.mood-celebrate {
    animation: frog-bounce 0.6s ease-in-out infinite alternate;
  }

  &.mood-curious {
    animation: frog-tilt 1.2s ease-in-out infinite alternate;
  }

  &.mood-sleepy {
    animation: frog-sway 2s ease-in-out infinite;
    .frog-eye .eye-white { opacity: 0.7; }
  }
}

@keyframes frog-bounce {
  from { transform: translateY(0) rotate(-3deg); }
  to { transform: translateY(-8rpx) rotate(3deg); }
}

@keyframes frog-tilt {
  from { transform: rotate(-5deg); }
  to { transform: rotate(5deg); }
}

@keyframes frog-sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

.frog-body {
  position: relative;
  background: $frog-body-color;
  border-radius: 50% 50% 45% 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
  box-shadow:
    inset 0 -20rpx 40rpx rgba(0,0,0,0.08),
    0 8rpx 24rpx rgba(123, 198, 126, 0.25);
}

.frog-head {
  position: relative;
  background: $frog-body-color;
  border-radius: 50% 50% 40% 40%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.frog-eye {
  position: absolute;
  background: $frog-eye-white;
  border-radius: 50%;
  box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;

  .eye-white {
    background: $frog-eye-white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .eye-pupil {
    background: $frog-pupil;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .eye-highlight {
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 20%;
    right: 20%;
    opacity: 0.9;
  }
}

.frog-blush {
  position: absolute;
  background: #FFB3C6;
  border-radius: 50%;
  opacity: 0.45;
  bottom: 28%;
}

.frog-mouth {
  position: absolute;
  background: #E8536A;
  /* 微笑嘴巴：下弧线 */
  width: 40%;
  height: 20%;
  left: 30%;
  border-radius: 0 0 50% 50%;
  overflow: hidden;

  &.oh {
    width: 12%;
    height: 12%;
    left: 44%;
    background: #E8536A;
    border-radius: 50%;
  }

  &.straight {
    width: 25%;
    height: 4rpx;
    left: 37.5%;
    background: #E8536A;
    border-radius: 4rpx;
  }
}

.frog-belly {
  position: absolute;
  background: $frog-belly-color;
  border-radius: 50%;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: inset 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.frog-hat {
  position: absolute;
  display: flex;
  justify-content: center;
}

/* 手臂（庆祝/激动时） */
.frog-arm {
  position: absolute;
  background: $frog-body-color;
  border-radius: 50% 50% 40% 40%;
  top: 35%;
  box-shadow: 0 4rpx 8rpx rgba(123,198,126,0.2);

  &.left {
    left: -15%;
    transform: rotate(-30deg);
    animation: arm-wave-left 0.5s ease-in-out infinite alternate;
  }

  &.right {
    right: -15%;
    transform: rotate(30deg);
    animation: arm-wave-right 0.5s ease-in-out infinite alternate;
  }
}

@keyframes arm-wave-left {
  from { transform: rotate(-40deg); }
  to { transform: rotate(-20deg); }
}

@keyframes arm-wave-right {
  from { transform: rotate(20deg); }
  to { transform: rotate(40deg); }
}

/* 对话气泡 */
.frog-bubble {
  position: absolute;
  top: -20rpx;
  left: calc(100% + 16rpx);
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 16rpx 20rpx;
  max-width: 240rpx;
  box-shadow: $shadow-md;
  z-index: 10;
  white-space: pre-wrap;

  .bubble-text {
    font-size: 24rpx;
    color: $text-primary;
    line-height: 1.5;
  }

  .bubble-tail {
    position: absolute;
    left: -12rpx;
    top: 20rpx;
    width: 0;
    height: 0;
    border-top: 12rpx solid transparent;
    border-bottom: 12rpx solid transparent;
    border-right: 16rpx solid $bg-card;
  }
}
</style>
