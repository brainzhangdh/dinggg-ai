<!-- 顶呱呱AI宝 - 对话页面 -->
<template>
  <view class="chat-page">
    <!-- 顶部导航 -->
    <view class="chat-header">
      <view class="back-btn" @tap="goBack">←</view>
      <view class="scene-info">
        <text class="scene-name">{{ sceneName }}</text>
        <text class="session-status">进行中</text>
      </view>
      <view class="stars-badge">
        ⭐ {{ stars }}
      </view>
    </view>

    <!-- 对话区域 -->
    <scroll-view
      class="message-list"
      :scroll-top="scrollTop"
      scroll-y
      :show-scrollbar="false"
    >
      <!-- AI开场白 -->
      <view class="message-wrapper assistant">
        <view class="ai-avatar">🤖</view>
        <view class="message-bubble">
          <text class="message-text">{{ initialMessage }}</text>
        </view>
      </view>

      <!-- 消息列表 -->
      <view
        v-for="msg in messages"
        :key="msg.id"
        class="message-wrapper"
        :class="msg.role"
      >
        <!-- 用户消息 -->
        <template v-if="msg.role === 'user'">
          <view class="message-bubble user">
            <text class="message-text">{{ msg.text }}</text>
            <view v-if="msg.audioUrl" class="audio-indicator">🎤</view>
          </view>
        </template>

        <!-- AI回复 -->
        <template v-else>
          <view class="ai-avatar">🤖</view>
          <view class="message-bubble assistant">
            <text class="message-text">{{ msg.text }}</text>
            <!-- 纠错提示 -->
            <view v-if="msg.correction && msg.correction.hasError" class="correction-tip">
              <text class="tip-label">💡 小建议：</text>
              <text class="tip-text">{{ msg.correction.tip }}</text>
            </view>
          </view>
        </template>
      </view>

      <!-- 加载中 -->
      <view v-if="isLoading" class="message-wrapper assistant">
        <view class="ai-avatar">🤖</view>
        <view class="message-bubble loading">
          <text class="loading-text">思考中...</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区 -->
    <view class="input-area">
      <!-- 打字输入模式 -->
      <view v-if="inputMode === 'text'" class="text-input-wrapper">
        <input
          class="text-input"
          v-model="inputText"
          placeholder="输入文字..."
          confirm-type="send"
          @confirm="sendTextMessage"
        />
        <view class="send-btn" @tap="sendTextMessage">发送</view>
      </view>

      <!-- 语音输入按钮 -->
      <view
        class="voice-btn"
        :class="{ recording: isRecording, 'large-mode': isTablet }"
        @touchstart="startRecording"
        @touchend="stopRecording"
        @longpress="switchToText"
      >
        <text class="voice-icon">{{ isRecording ? '🔴' : '🎤' }}</text>
        <text class="voice-hint">{{ isRecording ? '松开发送' : '按住说话' }}</text>
      </view>

      <!-- 模式切换 -->
      <view class="mode-toggle" @tap="toggleInputMode">
        {{ inputMode === 'voice' ? '⌨️' : '🎤' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// 页面参数
const sceneId = ref('')
const sceneName = ref('')

// 对话相关
const messages = ref([])
const inputText = ref('')
const inputMode = ref('voice') // 'voice' | 'text'
const isRecording = ref(false)
const isLoading = ref(false)
const scrollTop = ref(0)
const stars = ref(0)
const initialMessage = ref('')

// 屏幕信息
const isTablet = ref(false)

// 录音管理
let recorderManager = null
let audioContext = null

// 初始化
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  sceneId.value = options.sceneId || ''
  sceneName.value = decodeURIComponent(options.sceneName || '情景对话')

  // 获取屏幕信息
  const sysInfo = uni.getSystemInfoSync()
  isTablet.value = sysInfo.windowWidth >= 768

  // 初始化录音
  initRecorder()

  // 初始化音频播放
  initAudio()

  // 加载初始消息
  loadInitialMessage()
})

// 初始化录音
function initRecorder() {
  recorderManager = uni.getRecorderManager()

  recorderManager.onStop((res) => {
    if (res.duration > 0) {
      // 上传语音
      uploadVoice(res.tempFilePath)
    }
  })

  recorderManager.onError((err) => {
    console.error('录音错误:', err)
    uni.showToast({ title: '录音失败', icon: 'none' })
  })
}

// 初始化音频播放
function initAudio() {
  audioContext = uni.createInnerAudioContext()
  audioContext.onEnded(() => {
    // 播放完毕
  })
}

// 加载初始消息
async function loadInitialMessage() {
  // TODO: 调用API获取开场白
  initialMessage.value = `Hi there! 👋 I'm your English practice buddy! Let's talk about ${sceneName.value} together! You can say anything you want, and I'll help you practice. Ready?`
}

// 开始录音
function startRecording(e) {
  e.preventDefault()
  isRecording.value = true

  recorderManager.start({
    format: 'mp3',
    duration: 60000, // 60秒
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000
  })
}

// 停止录音
function stopRecording() {
  if (!isRecording.value) return
  isRecording.value = false
  recorderManager.stop()
}

// 上传语音
async function uploadVoice(tempFilePath) {
  isLoading.value = true

  try {
    // 1. 获取Token (假设已登录)
    const token = uni.getStorageSync('token')

    // 2. 调用API
    const res = await uni.uploadFile({
      url: 'https://api.dinggg.com/api/chat/message',
      filePath: tempFilePath,
      name: 'audio',
      header: {
        Authorization: `Bearer ${token}`
      },
      formData: {
        sceneId: sceneId.value,
        sessionId: getSessionId(),
        type: 'voice'
      }
    })

    const data = JSON.parse(res.data)

    if (data.code === 0) {
      handleAIReply(data.data)
    } else {
      uni.showToast({ title: data.message || '发送失败', icon: 'none' })
    }
  } catch (err) {
    console.error('发送失败:', err)
    uni.showToast({ title: '发送失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 发送文字消息
async function sendTextMessage() {
  if (!inputText.value.trim()) return

  const text = inputText.value.trim()
  inputText.value = ''

  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    text: text
  })

  scrollToBottom()
  isLoading.value = true

  try {
    const token = uni.getStorageSync('token')
    const res = await uni.request({
      url: 'https://api.dinggg.com/api/chat/message',
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        sceneId: sceneId.value,
        sessionId: getSessionId(),
        type: 'text',
        text: text
      }
    })

    if (res.data.code === 0) {
      handleAIReply(res.data.data)
    }
  } catch (err) {
    console.error('发送失败:', err)
  } finally {
    isLoading.value = false
  }
}

// 处理AI回复
function handleAIReply(data) {
  messages.value.push({
    id: Date.now(),
    role: 'assistant',
    text: data.text,
    audioUrl: data.audioUrl,
    correction: data.correction
  })

  stars.value += data.starsEarned || 0
  scrollToBottom()

  // 播放AI语音
  if (data.audioUrl) {
    playAudio(data.audioUrl)
  }
}

// 播放音频
function playAudio(url) {
  audioContext.src = url
  audioContext.play()
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = Date.now()
  })
}

// 切换输入模式
function toggleInputMode() {
  inputMode.value = inputMode.value === 'voice' ? 'text' : 'voice'
}

// 切换到打字模式
function switchToText() {
  inputMode.value = 'text'
}

// 获取/创建会话ID
function getSessionId() {
  let sessionId = uni.getStorageSync('currentSessionId')
  if (!sessionId) {
    sessionId = 'session_' + Date.now()
    uni.setStorageSync('currentSessionId', sessionId)
  }
  return sessionId
}

// 返回
function goBack() {
  uni.navigateBack()
}

// 页面卸载
onUnmounted(() => {
  if (audioContext) {
    audioContext.destroy()
  }
})
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-color;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  background: $primary-color;
  color: $text-white;
}

.back-btn {
  font-size: 24px;
  padding: $spacing-sm $spacing-md;
}

.scene-info {
  flex: 1;
  margin-left: $spacing-sm;
}

.scene-name {
  font-size: 16px;
  font-weight: 600;
  display: block;
}

.session-status {
  font-size: 12px;
  opacity: 0.8;
}

.stars-badge {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
}

.message-list {
  flex: 1;
  padding: $spacing-md;
  overflow-y: auto;
}

.message-wrapper {
  display: flex;
  margin-bottom: $spacing-md;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .message-bubble {
      background: $primary-color;
      color: $text-white;
      border-radius: $radius-lg $radius-lg $radius-sm $radius-lg;
      margin-right: $spacing-sm;
      max-width: 75%;
    }
  }

  &.assistant {
    .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E8E6FF, #D4D0FF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-right: $spacing-sm;
    }

    .message-bubble {
      background: $card-bg;
      border-radius: $radius-lg $radius-lg $radius-lg $radius-sm;
      padding: $spacing-md;
      box-shadow: $shadow-sm;
      max-width: 75%;
    }
  }
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
}

.correction-tip {
  margin-top: $spacing-sm;
  padding: $spacing-sm;
  background: #FFF9E6;
  border-radius: $radius-sm;
  font-size: 13px;
}

.tip-label {
  color: $accent-color;
  font-weight: 600;
}

.audio-indicator {
  display: inline-block;
  margin-left: $spacing-xs;
}

.loading-text {
  color: $text-hint;
  font-style: italic;
}

.input-area {
  padding: $spacing-md;
  background: $card-bg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  border-top: 1px solid #eee;
}

.text-input-wrapper {
  flex: 1;
  display: flex;
  gap: $spacing-sm;
}

.text-input {
  flex: 1;
  height: 40px;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 0 $spacing-md;
  font-size: 14px;
}

.send-btn {
  width: 60px;
  height: 40px;
  background: $primary-color;
  color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.voice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary-color, #8B83FF);
  box-shadow: 0 4px 16px rgba(108, 99, 255, 0.4);
  transition: all 0.2s;

  &.recording {
    background: linear-gradient(135deg, $error-color, #FF6B6B);
    transform: scale(1.1);
  }

  &.large-mode {
    width: 96px;
    height: 96px;
  }
}

.voice-icon {
  font-size: 28px;
}

.voice-hint {
  font-size: 10px;
  color: rgba(255,255,255,0.9);
  margin-top: 2px;
}

.mode-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
</style>
