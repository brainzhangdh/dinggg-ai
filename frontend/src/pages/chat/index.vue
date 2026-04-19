<!-- 顶呱呱AI宝 - AI对话页面 -->
<template>
  <view class="chat-page">
    <!-- 顶部导航 -->
    <view class="chat-header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">←</view>
        <view class="frog-header">
          <FrogCharacter size="xs" :mood="frogMood" :showHat="true" />
        </view>
        <view class="scene-info">
          <text class="scene-name">{{ sceneName }}</text>
          <text class="session-status">进行中 · {{ currentRound }}/{{ totalRounds }}</text>
        </view>
      </view>
      <view class="header-right">
        <view class="progress-ring-wrap">
          <view class="progress-ring">
            <svg viewBox="0 0 36 36" class="ring-svg">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="white" stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="`${progressArc} 94`"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <text class="ring-text">{{ currentRound }}/{{ totalRounds }}</text>
          </view>
        </view>
        <view class="stars-badge" @tap="showStarsDetail">
          <text class="stars-icon">⭐</text>
          <text class="stars-num">{{ stars }}</text>
        </view>
      </view>
    </view>

    <!-- 对话进度条 -->
    <view class="progress-bar-wrap">
      <view class="progress-bar-track">
        <view class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="message-list"
      :scroll-top="scrollTop"
      scroll-y
      :show-scrollbar="false"
      :refresher-enabled="false"
    >
      <!-- AI开场白 -->
      <view class="opening-section">
        <ChatBubble
          role="assistant"
          type="text"
          :text="initialMessage"
          :typing="true"
          :showTime="true"
          timeText="刚刚"
        />
      </view>

      <!-- 消息列表 -->
      <view
        v-for="(msg, idx) in messages"
        :key="msg.id"
        class="message-item"
      >
        <ChatBubble
          :role="msg.role"
          :type="msg.type || 'text'"
          :text="msg.text"
          :audioUrl="msg.audioUrl"
          :duration="msg.duration"
          :correction="msg.correction"
          :encourageText="msg.encourageText"
          :showTime="true"
          :timeText="getTimeText(msg.timestamp)"
          :userAvatar="userInfo.avatar"
          :typing="false"
          @play-audio="playAudio(msg.audioUrl)"
        />
      </view>

      <!-- 加载中 -->
      <view v-if="isLoading" class="loading-wrapper">
        <view class="loading-dots">
          <view class="dot" v-for="n in 3" :key="n" :style="{ animationDelay: `${n * 0.15}s` }"></view>
        </view>
        <FrogCharacter size="xs" mood="curious" />
      </view>

      <!-- 底部安全区 -->
      <view class="list-bottom" />
    </scroll-view>

    <!-- 底部输入区 -->
    <view class="input-area">
      <!-- 打字输入模式 -->
      <view v-if="inputMode === 'text'" class="text-input-mode">
        <input
          class="text-input"
          v-model="inputText"
          placeholder="输入文字发送..."
          confirm-type="send"
          @confirm="sendTextMessage"
        />
        <view class="send-btn" @tap="sendTextMessage">
          <text class="send-icon">➤</text>
        </view>
      </view>

      <!-- 语音输入按钮 -->
      <view
        v-else
        class="voice-input-wrap"
      >
        <view
          class="voice-btn-main"
          :class="{ recording: isRecording, pressed: isPressed }"
          @touchstart.prevent="onVoiceTouchStart"
          @touchend.prevent="onVoiceTouchEnd"
          @touchcancel="onVoiceTouchEnd"
          @longpress="switchToTextMode"
        >
          <text class="voice-icon-main">{{ isRecording ? '🔴' : '🎤' }}</text>
          <text class="voice-label">{{ isRecording ? '松开发送' : '按住说话' }}</text>
          <!-- 录音波形（正在录音时） -->
          <view v-if="isRecording" class="recording-wave">
            <view class="wave-line" v-for="n in 8" :key="n" :style="{ animationDelay: `${n * 0.05}s` }"></view>
          </view>
        </view>

        <!-- 取消录音 -->
        <view v-if="isRecording" class="cancel-btn" @tap="cancelRecording">
          <text>✕ 取消</text>
        </view>
      </view>

      <!-- 模式切换按钮 -->
      <view class="mode-toggle" @tap="toggleInputMode">
        <text>{{ inputMode === 'voice' ? '⌨️' : '🎤' }}</text>
      </view>
    </view>

    <!-- 打卡完成弹窗 -->
    <view v-if="showCompletionModal" class="completion-overlay" @tap="closeModal">
      <view class="completion-modal" @tap.stop>
        <FrogCharacter size="lg" mood="celebrate" :showHat="true" />
        <text class="completion-title">太棒了！🎉</text>
        <text class="completion-sub">本轮对话完成</text>
        <view class="completion-stars">
          <text class="completion-stars-label">获得</text>
          <StarBadge type="star" count="+{{ earnedStars }}" :animate="true" size="lg" />
          <text class="completion-stars-label">星星</text>
        </view>
        <view class="completion-stats">
          <view class="stat-item">
            <text class="stat-num">{{ sessionStats.turns }}</text>
            <text class="stat-label">对话轮次</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ sessionStats.duration }}</text>
            <text class="stat-label">分钟</text>
          </view>
        </view>
        <view class="completion-btns">
          <view class="btn btn-outline btn-sm" @tap="goHome">返回首页</view>
          <view class="btn btn-primary btn-sm" @tap="continuePractice">继续练习</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
// uni-app page lifecycle - onLoad is auto-global in script setup
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import FrogCharacter from '@/components/FrogCharacter/FrogCharacter.vue'
import ChatBubble from '@/components/ChatBubble/ChatBubble.vue'
import StarBadge from '@/components/StarBadge/StarBadge.vue'

// 页面参数
const sceneId = ref('')
const sceneName = ref('')

// 对话
const messages = ref([])
const inputText = ref('')
const inputMode = ref('voice') // 'voice' | 'text'
const isRecording = ref(false)
const isPressed = ref(false)
const isLoading = ref(false)
const scrollTop = ref(0)
const stars = ref(0)
const earnedStars = ref(0)
const initialMessage = ref('')
const currentRound = ref(1)
const totalRounds = ref(5)
const sessionStartTime = ref(null)

// 弹窗
const showCompletionModal = ref(false)

// 用户信息
const userInfo = ref({
  nickname: '',
  avatar: ''
})

// 录音管理
let recorderManager = null
let audioContext = null
let currentTempFile = ''

// AI情绪
const frogMood = computed(() => {
  if (isLoading.value) return 'curious'
  if (messages.value.length > 0 && messages.value[messages.value.length - 1]?.correction?.show) return 'encourage'
  if (currentRound.value >= totalRounds.value) return 'celebrate'
  return 'happy'
})

// 进度环
const progressArc = computed(() => {
  const percent = currentRound.value / totalRounds.value
  return 94 * percent
})

// 进度条
const progressPercent = computed(() => {
  return (currentRound.value / totalRounds.value) * 100
})

// 回合进度
const sessionStats = computed(() => {
  const minutes = sessionStartTime.value
    ? Math.round((Date.now() - sessionStartTime.value) / 60000)
    : 0
  return {
    turns: messages.value.length,
    duration: minutes
  }
})

function getTimeText(timestamp) {
  if (!timestamp) return '刚刚'
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.round(diff / 60000)}分钟前`
  return '早些时候'
}

onMounted(() => {
  // 获取页面参数（通过getCurrentPages）
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const options = currentPage.options || {}
    sceneId.value = options.sceneId || ''
    sceneName.value = decodeURIComponent(options.sceneName || '情景对话')
  }
  
  // 初始化录音
  initRecorder()
  initAudio()

  // 加载初始消息
  loadInitialMessage()

  // 加载用户信息
  userInfo.value.avatar = uni.getStorageSync('avatar') || ''
  sessionStartTime.value = Date.now()
})

function initRecorder() {
  // 检查是否支持录音（小程序环境）
  if (typeof uni.getRecorderManager === 'function') {
    recorderManager = uni.getRecorderManager()

    recorderManager.onStop((res) => {
      if (res.duration > 500 && currentTempFile) {
        uploadVoice(currentTempFile, res.duration)
      }
      currentTempFile = ''
    })

    recorderManager.onError((err) => {
      console.error('录音错误:', err)
      uni.showToast({ title: '录音失败，请重试', icon: 'none' })
      isRecording.value = false
    })
  } else {
    console.warn('当前环境不支持录音功能')
    recorderManager = null
  }
}

function initAudio() {
  audioContext = uni.createInnerAudioContext()
  audioContext.onEnded(() => {})
}

async function loadInitialMessage() {
  const messages_map = {
    1: "Hi there! 👋 Let's talk about your favorite cartoon! What do you usually watch?",
    2: "Hey! 🏫 How was your school today? Did you learn anything fun in English class?",
    3: "Hi! 🤝 I'm Tom, nice to meet you! Where are you from?",
    default: `Hi friend! 👋 Welcome to our English chat! Let's talk about ${sceneName.value} together!`
  }
  initialMessage.value = messages_map[sceneId.value] || messages_map.default
  await nextTick()
  scrollToBottom()
}

// 语音TouchStart
function onVoiceTouchStart(e) {
  isPressed.value = true
  setTimeout(() => {
    if (isPressed.value) {
      isRecording.value = true
      startRecording()
    }
  }, 100)
}

// 语音TouchEnd
function onVoiceTouchEnd() {
  isPressed.value = false
  if (isRecording.value) {
    isRecording.value = false
    stopRecording()
  }
}

function startRecording() {
  if (!recorderManager) {
    uni.showToast({ title: '当前环境不支持录音', icon: 'none' })
    return
  }
  recorderManager.start({
    format: 'mp3',
    duration: 60000,
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000
  })
}

function stopRecording() {
  if (!recorderManager) return
  recorderManager.stop()
}

function cancelRecording() {
  isRecording.value = false
  currentTempFile = ''
  if (recorderManager) recorderManager.stop()
}

async function uploadVoice(tempFilePath, duration) {
  isLoading.value = true

  // 添加用户消息
  const userMsg = {
    id: Date.now(),
    role: 'user',
    type: 'audio',
    audioUrl: tempFilePath,
    duration: formatDuration(duration),
    timestamp: Date.now()
  }
  messages.value.push(userMsg)
  scrollToBottom()

  try {
    await simulateAIReply()
  } finally {
    isLoading.value = false
  }
}

// 模拟AI回复（实际项目替换为API调用）
async function simulateAIReply() {
  const responses = [
    {
      text: "That's wonderful! 🌟 Tell me more about it! What is your favorite character?",
      correction: null,
      encourageText: null
    },
    {
      text: "Great job! You're speaking really well! 💪",
      correction: {
        show: true,
        text: "想说 'watching cartoons' 的话，可以说 'I like watching cartoons on weekends!' 会更完整哦～"
      },
      encourageText: "继续保持！💪"
    },
    {
      text: "Excellent! 🌟 Your pronunciation is getting better! Keep it up!",
      correction: null,
      encourageText: "发音越来越棒了！🎉"
    }
  ]

  const response = responses[Math.floor(Math.random() * responses.length)]

  await new Promise(resolve => setTimeout(resolve, 1500))

  const aiMsg = {
    id: Date.now(),
    role: 'assistant',
    type: 'text',
    text: response.text,
    correction: response.correction,
    encourageText: response.encourageText,
    starsEarned: Math.floor(Math.random() * 3) + 1,
    timestamp: Date.now()
  }

  messages.value.push(aiMsg)
  stars.value += aiMsg.starsEarned
  earnedStars.value += aiMsg.starsEarned
  currentRound.value++

  if (currentRound.value > totalRounds.value) {
    setTimeout(() => {
      showCompletionModal.value = true
    }, 1000)
  }

  scrollToBottom()
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return `${min}:${s.toString().padStart(2, '0')}`
}

async function sendTextMessage() {
  if (!inputText.value.trim()) return

  const text = inputText.value.trim()
  inputText.value = ''

  messages.value.push({
    id: Date.now(),
    role: 'user',
    type: 'text',
    text,
    timestamp: Date.now()
  })

  scrollToBottom()
  isLoading.value = true

  try {
    await simulateAIReply()
  } finally {
    isLoading.value = false
  }
}

function playAudio(url) {
  audioContext.src = url
  audioContext.play()
}

function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = Date.now()
  })
}

function toggleInputMode() {
  inputMode.value = inputMode.value === 'voice' ? 'text' : 'voice'
}

function switchToTextMode() {
  inputMode.value = 'text'
}

function goBack() {
  if (messages.value.length > 0) {
    uni.showModal({
      title: '离开对话？',
      content: '离开后本轮进度不会保存哦～',
      confirmText: '确定离开',
      cancelText: '继续对话',
      success: (res) => {
        if (res.confirm) uni.navigateBack()
      }
    })
  } else {
    uni.navigateBack()
  }
}

function showStarsDetail() {
  uni.showToast({ title: `今日获得 ${stars.value} 颗星星`, icon: 'none' })
}

function closeModal() {
  showCompletionModal.value = false
}

function goHome() {
  showCompletionModal.value = false
  uni.switchTab({ url: '/pages/index/index' })
}

function continuePractice() {
  showCompletionModal.value = false
  currentRound.value = 1
  messages.value = []
  sessionStartTime.value = Date.now()
  loadInitialMessage()
}

onUnmounted(() => {
  if (audioContext) audioContext.destroy()
})
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-child;
}

/* 顶部导航 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(#{$spacing-sm} + constant(safe-area-inset-top)) $spacing-lg $spacing-sm;
  padding: calc(#{$spacing-sm} + env(safe-area-inset-top)) $spacing-lg $spacing-sm;
  background: $gradient-hero;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.back-btn {
  font-size: 40rpx;
  color: rgba(255,255,255,0.9);
  padding: $spacing-xs $spacing-sm;
  -webkit-tap-highlight-color: transparent;
}

.frog-header {
  display: flex;
  align-items: center;
}

.scene-info {
  display: flex;
  flex-direction: column;
}

.scene-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-white;
}

.session-status {
  font-size: 22rpx;
  color: rgba(255,255,255,0.75);
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.progress-ring-wrap {
  display: flex;
  align-items: center;
}

.progress-ring {
  position: relative;
  width: 72rpx;
  height: 72rpx;
}

.ring-svg {
  width: 100%;
  height: 100%;
  circle {
    transition: stroke-dasharray 0.4s ease;
  }
}

.ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
  color: $text-white;
}

.stars-badge {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: rgba(255,255,255,0.2);
  padding: 8rpx 16rpx;
  border-radius: $radius-full;

  .stars-icon { font-size: 28rpx; }
  .stars-num {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-white;
  }
}

/* 进度条 */
.progress-bar-wrap {
  padding: 0 $spacing-lg;
  background: $gradient-hero;
  padding-bottom: $spacing-sm;
  flex-shrink: 0;
}

.progress-bar-track {
  height: 6rpx;
  background: rgba(255,255,255,0.3);
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: white;
  border-radius: $radius-full;
  transition: width 0.4s ease-out;
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: $spacing-lg;
  overflow-y: auto;
}

.opening-section {
  margin-bottom: $spacing-lg;
}

.message-item {
  margin-bottom: $spacing-sm;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md 0;
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 6rpx;

  .dot {
    width: 12rpx;
    height: 12rpx;
    background: $brand-blue;
    border-radius: 50%;
    animation: dot-pulse 0.8s ease-in-out infinite alternate;
  }
}

@keyframes dot-pulse {
  from { opacity: 0.3; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}

.list-bottom {
  height: $spacing-lg;
}

/* 底部输入区 */
.input-area {
  padding: $spacing-md $spacing-lg;
  padding-bottom: calc(#{$spacing-md} + constant(safe-area-inset-bottom));
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background: $bg-card;
  border-top: 1rpx solid $border-light;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-shrink: 0;
}

/* 打字输入 */
.text-input-mode {
  flex: 1;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.text-input {
  flex: 1;
  height: 72rpx;
  background: #F5F7FA;
  border-radius: 36rpx;
  padding: 0 $spacing-lg;
  font-size: 28rpx;
  color: $text-primary;

  &::placeholder { color: $text-hint; }
}

.send-btn {
  width: 72rpx;
  height: 72rpx;
  background: $gradient-btn;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(123, 198, 126, 0.35);
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;

  .send-icon {
    font-size: 28rpx;
    color: white;
  }
}

/* 语音输入 */
.voice-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
}

.voice-btn-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $gradient-btn;
  box-shadow: 0 8rpx 24rpx rgba(123, 198, 126, 0.4);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;

  &.pressed {
    transform: scale(0.95);
    background: linear-gradient(135deg, darken($brand-green, 5%), darken($success-green, 5%));
  }

  &.recording {
    background: linear-gradient(135deg, $brand-orange, #FF6B35);
    box-shadow: 0 8rpx 24rpx rgba(251, 146, 60, 0.5);
    animation: pulse-ring 1s ease-in-out infinite;
  }

  .voice-icon-main {
    font-size: 44rpx;
    margin-bottom: 4rpx;
  }

  .voice-label {
    font-size: 20rpx;
    color: rgba(255,255,255,0.9);
    font-weight: 500;
  }
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.5); }
  50% { box-shadow: 0 0 0 16rpx rgba(251, 146, 60, 0); }
}

.recording-wave {
  position: absolute;
  bottom: 8rpx;
  display: flex;
  align-items: flex-end;
  gap: 3rpx;
  height: 24rpx;

  .wave-line {
    width: 4rpx;
    background: rgba(255,255,255,0.8);
    border-radius: 2rpx;
    animation: wave-bar 0.5s ease-in-out infinite alternate;
  }
}

@keyframes wave-bar {
  from { height: 4rpx; }
  to { height: 20rpx; }
}

.cancel-btn {
  font-size: 26rpx;
  color: $text-secondary;
  padding: $spacing-sm $spacing-md;
  background: #f5f5f5;
  border-radius: $radius-full;
  -webkit-tap-highlight-color: transparent;
}

.mode-toggle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F5F7FA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

/* 完成弹窗 */
.completion-overlay {
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

.completion-modal {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: $spacing-xl $spacing-lg;
  width: 600rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  box-shadow: $shadow-lg;
}

.completion-title {
  font-size: 48rpx;
  font-weight: 800;
  color: $text-primary;
}

.completion-sub {
  font-size: 28rpx;
  color: $text-secondary;
}

.completion-stars {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin: $spacing-sm 0;

  .completion-stars-label {
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.completion-stats {
  display: flex;
  gap: $spacing-xl;
  margin: $spacing-sm 0;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;

    .stat-num {
      font-size: 40rpx;
      font-weight: 800;
      color: $brand-blue;
    }

    .stat-label {
      font-size: 24rpx;
      color: $text-secondary;
    }
  }
}

.completion-btns {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-sm;
  width: 100%;
}
</style>
