<!-- 对话气泡组件 -->
<!-- 支持：用户气泡、AI气泡、鼓励式纠错、语音波形 -->
<template>
  <view class="chat-bubble-wrapper" :class="[role, { 'is-typing': isTyping }]">
    <!-- AI头像 -->
    <view v-if="role === 'assistant'" class="bubble-avatar">
      <FrogCharacter size="sm" :mood="avatarMood" />
    </view>

    <!-- 气泡主体 -->
    <view class="bubble-body">
      <!-- 主内容 -->
      <view class="bubble-main">
        <!-- 语音消息 -->
        <view v-if="type === 'audio'" class="audio-message" @tap="playAudio">
          <view class="audio-icon">🎤</view>
          <view class="audio-wave">
            <view class="wave-bar" v-for="n in 5" :key="n" :style="{ animationDelay: `${n * 0.1}s` }"></view>
          </view>
          <text class="audio-duration">{{ duration || '0:00' }}</text>
        </view>

        <!-- 文字消息 -->
        <text v-else class="bubble-text">
          <text
            v-for="(char, idx) in displayText"
            :key="idx"
            class="typing-char"
            :style="{ animationDelay: `${idx * 50}ms` }"
          >{{ char === ' ' ? '\u00A0' : char }}</text>
        </text>
      </view>

      <!-- 纠错提示（温和鼓励式） -->
      <view v-if="correction && correction.show" class="correction-tip">
        <text class="tip-icon">💡</text>
        <view class="tip-content">
          <text class="tip-title">小建议：</text>
          <text class="tip-text">{{ correction.text }}</text>
        </view>
      </view>

      <!-- 鼓励语 -->
      <view v-if="encourageText" class="encourage-tip">
        <text class="encourage-emoji">🌟</text>
        <text class="encourage-text">{{ encourageText }}</text>
      </view>

      <!-- 时间戳 -->
      <view v-if="showTime && timeText" class="bubble-time">
        <text>{{ timeText }}</text>
      </view>
    </view>

    <!-- 用户头像 -->
    <view v-if="role === 'user'" class="bubble-avatar user">
      <image
        :src="userAvatar || '/static/default-avatar.png'"
        class="avatar-img"
        mode="aspectFill"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import FrogCharacter from '../FrogCharacter/FrogCharacter.vue'

const props = defineProps({
  // 角色: user | assistant
  role: {
    type: String,
    default: 'assistant'
  },
  // 消息类型: text | audio
  type: {
    type: String,
    default: 'text'
  },
  // 文字内容
  text: {
    type: String,
    default: ''
  },
  // 语音地址
  audioUrl: {
    type: String,
    default: ''
  },
  // 语音时长
  duration: {
    type: String,
    default: ''
  },
  // 纠错信息
  correction: {
    type: Object,
    default: null
  },
  // 鼓励语
  encourageText: {
    type: String,
    default: ''
  },
  // 是否显示打字效果
  typing: {
    type: Boolean,
    default: false
  },
  // 是否显示时间
  showTime: {
    type: Boolean,
    default: false
  },
  // 时间文字
  timeText: {
    type: String,
    default: '刚刚'
  },
  // 用户头像
  userAvatar: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['play-audio'])

// 打字效果
const isTyping = ref(false)
const displayText = ref('')

watch(() => props.text, (newVal) => {
  if (props.typing && newVal) {
    isTyping.value = true
    displayText.value = ''
    let idx = 0
    const timer = setInterval(() => {
      displayText.value = newVal.slice(0, idx + 1)
      idx++
      if (idx >= newVal.length) {
        clearInterval(timer)
        isTyping.value = false
      }
    }, 50)
  } else {
    displayText.value = newVal
  }
}, { immediate: true })

// AI头像情绪
const avatarMood = computed(() => {
  if (props.correction && props.correction.show) return 'encourage'
  if (props.encourageText) return 'celebrate'
  return 'happy'
})

// 播放音频
function playAudio() {
  emit('play-audio', props.audioUrl)
}

onMounted(() => {
  if (!props.typing) {
    displayText.value = props.text
  }
})
</script>

<style lang="scss" scoped>
.chat-bubble-wrapper {
  display: flex;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  animation: bubble-in 0.2s ease-out;

  &.user {
    flex-direction: row-reverse;

    .bubble-body {
      background: linear-gradient(135deg, $brand-green 0%, #68D391 100%);
      color: $text-white;
      border-radius: $radius-xl $radius-xl $radius-sm $radius-xl;
      margin-right: $spacing-sm;
      box-shadow: 0 4rpx 16rpx rgba(123, 198, 126, 0.3);
      max-width: 75%;
    }

    .bubble-text {
      color: $text-white;
    }

    .correction-tip {
      background: rgba(255,255,255,0.2);
      .tip-title, .tip-text { color: rgba(255,255,255,0.95); }
    }

    .encourage-tip {
      background: rgba(255,255,255,0.15);
      .encourage-text { color: rgba(255,255,255,0.9); }
    }

    .bubble-time {
      color: rgba(255,255,255,0.7);
    }

    .audio-message {
      .audio-icon, .audio-duration { color: $text-white; }
      .wave-bar { background: rgba(255,255,255,0.8); }
    }
  }

  &.assistant {
    .bubble-body {
      background: $bg-bubble-ai;
      border-radius: $radius-xl $radius-xl $radius-xl $radius-sm;
      box-shadow: $shadow-sm;
      margin-left: $spacing-sm;
      max-width: 78%;
      /* AI气泡左上角稍尖，模拟机器人 */
      border-top-left-radius: ($radius-xl + 8px);
    }
  }
}

@keyframes bubble-in {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;

  &.user {
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: $border-light;
    }
  }
}

.bubble-body {
  display: flex;
  flex-direction: column;
  padding: $spacing-md $spacing-lg;
}

.bubble-main {
  display: flex;
  flex-direction: column;
}

.bubble-text {
  font-size: 30rpx;
  line-height: 1.7;
  color: $text-primary;
  word-break: break-word;
  white-space: pre-wrap;
}

.typing-char {
  animation: typing 50ms linear;
  display: inline-block;
}

@keyframes typing {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 语音消息 */
.audio-message {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 200rpx;

  .audio-icon {
    font-size: 28rpx;
    flex-shrink: 0;
  }

  .audio-wave {
    display: flex;
    align-items: center;
    gap: 3rpx;
    height: 32rpx;
    flex: 1;
  }

  .wave-bar {
    width: 4rpx;
    height: 100%;
    background: $brand-green;
    border-radius: 2rpx;
    animation: wave-pulse 0.8s ease-in-out infinite alternate;

    @for $i from 1 through 5 {
      &:nth-child(#{$i}) {
        height: #{30 + $i * 8%};
      }
    }
  }

  .audio-duration {
    font-size: 24rpx;
    color: $text-secondary;
    flex-shrink: 0;
  }
}

@keyframes wave-pulse {
  from { transform: scaleY(0.4); }
  to { transform: scaleY(1); }
}

/* 纠错提示（温和鼓励式） */
.correction-tip {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: #F0FFF4; // 淡绿色背景
  border-radius: $radius-md;
  border-left: 6rpx solid $success-green;

  .tip-icon {
    font-size: 28rpx;
    flex-shrink: 0;
    margin-top: 2rpx;
  }

  .tip-content {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  .tip-title {
    font-size: 26rpx;
    font-weight: 600;
    color: $success-green;
  }

  .tip-text {
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.6;
  }
}

/* 鼓励语 */
.encourage-tip {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: #FFFBEB;
  border-radius: $radius-md;

  .encourage-emoji {
    font-size: 26rpx;
    flex-shrink: 0;
  }

  .encourage-text {
    font-size: 26rpx;
    color: #B7791F;
    font-weight: 500;
  }
}

/* 时间戳 */
.bubble-time {
  font-size: 22rpx;
  color: $text-hint;
  margin-top: $spacing-xs;
  align-self: flex-end;
}
</style>
