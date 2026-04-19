<!-- 顶呱呱AI宝 - 微信登录页 -->
<template>
  <view class="login-page">
    <!-- 顶部装饰 -->
    <view class="top-decoration">
      <view class="deco-circle circle-1"></view>
      <view class="deco-circle circle-2"></view>
    </view>

    <!-- Logo区 -->
    <view class="logo-section">
      <view class="frog-logo">
        <FrogCharacter size="xl" mood="excited" :showHat="true" />
      </view>
      <view class="brand-text">
        <text class="brand-name">顶呱呱AI宝</text>
        <text class="brand-slogan">学好英语少不了 📣</text>
      </view>
    </view>

    <!-- 功能介绍 -->
    <view class="features-section">
      <view class="feature-item" v-for="f in features" :key="f.icon">
        <text class="feature-icon">{{ f.icon }}</text>
        <text class="feature-text">{{ f.text }}</text>
      </view>
    </view>

    <!-- 登录按钮区 -->
    <view class="login-section">
      <!-- 微信一键登录 -->
      <button
        class="btn-wechat"
        :class="{ loading: isLoading }"
        @tap="handleWechatLogin"
        :disabled="isLoading"
      >
        <text class="wechat-icon">💬</text>
        <text class="wechat-text">{{ isLoading ? '登录中...' : '微信一键登录' }}</text>
      </button>

      <!-- 青少年模式说明 -->
      <view class="youth-note">
        <text class="note-icon">ℹ️</text>
        <text class="note-text">
          本产品适合6-18岁儿童及青少年使用。登录即表示同意我们的服务协议和隐私政策。
        </text>
      </view>

      <!-- 分割线 -->
      <view class="divider-row">
        <view class="divider-line"></view>
        <text class="divider-text">其他登录方式</text>
        <view class="divider-line"></view>
      </view>

      <!-- 其他方式 -->
      <view class="other-login">
        <view class="other-btn" @tap="showPhoneLogin">
          <text class="other-icon">📱</text>
          <text class="other-label">手机号登录</text>
        </view>
        <view class="other-btn" @tap="showVisitorMode">
          <text class="other-icon">👤</text>
          <text class="other-label">游客体验</text>
        </view>
      </view>
    </view>

    <!-- 底部协议 -->
    <view class="bottom-agreements">
      <view class="agreement-check" @tap="toggleAgreement">
        <view class="check-box" :class="{ checked: agreed }">
          <text v-if="agreed" class="check-mark">✓</text>
        </view>
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @tap.stop="openAgreement('user')">《用户协议》</text>
          和
          <text class="link" @tap.stop="openAgreement('privacy')">《隐私政策》</text>
        </text>
      </view>
    </view>

    <!-- 手机号登录弹窗 -->
    <view v-if="showPhoneModal" class="modal-overlay" @tap="closePhoneModal">
      <view class="phone-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">手机号登录</text>
          <view class="modal-close" @tap="closePhoneModal">✕</view>
        </view>
        <view class="modal-body">
          <view class="phone-input-wrap">
            <view class="country-code">+86</view>
            <input
              class="phone-input"
              v-model="phoneNumber"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
              placeholder-class="placeholder"
            />
          </view>
          <view class="code-input-row">
            <input
              class="code-input"
              v-model="smsCode"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="placeholder"
            />
            <view
              class="send-code-btn"
              :class="{ disabled: countdown > 0 }"
              @tap="sendSmsCode"
            >
              <text>{{ countdown > 0 ? `${countdown}s` : '获取验证码' }}</text>
            </view>
          </view>
          <button class="btn btn-primary w-full mt-md" @tap="confirmPhoneLogin">
            确认登录
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import FrogCharacter from '@/components/FrogCharacter/FrogCharacter.vue'

const isLoading = ref(false)
const agreed = ref(false)
const showPhoneModal = ref(false)
const phoneNumber = ref('')
const smsCode = ref('')
const countdown = ref(0)
let countdownTimer = null

const features = [
  { icon: '🤖', text: 'AI外教陪练，敢说就会进步' },
  { icon: '🎤', text: '语音对话，练就纯正发音' },
  { icon: '🌟', text: '趣味激励，爱上开口说英语' },
  { icon: '👨‍👩‍👧', text: '家长实时了解学习进度' }
]

function toggleAgreement() {
  agreed.value = !agreed.value
}

async function handleWechatLogin() {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }

  isLoading.value = true

  try {
    // 微信登录
    const res = await new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      uni.getUserProfile({
        desc: '用于完善会员资料',
        success: (userRes) => {
          // 获取code
          uni.login({
            provider: 'weixin',
            success: (loginRes) => {
              resolve({ userRes, loginRes })
            },
            fail: reject
          })
        },
        fail: reject
      })
      // #endif
      // #ifndef MP-WEIXIN
      setTimeout(() => resolve({ userRes: {}, loginRes: { code: 'mock-code' } }), 1000)
      // #endif
    })

    // TODO: 调用后端登录接口
    await doLogin(res.loginRes.code, res.userRes.userInfo)
    goToHome()
  } catch (err) {
    console.error('登录失败:', err)
    // 演示模式：直接进入
    goToHome()
  } finally {
    isLoading.value = false
  }
}

async function doLogin(code, userInfo) {
  // 实际项目中调用后端接口
  uni.setStorageSync('nickname', userInfo?.nickName || '小明')
  uni.setStorageSync('avatar', userInfo?.avatarUrl || '')
}

function goToHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

function showPhoneLogin() {
  showPhoneModal.value = true
}

function closePhoneModal() {
  showPhoneModal.value = false
  phoneNumber.value = ''
  smsCode.value = ''
}

function sendSmsCode() {
  if (countdown.value > 0) return
  if (!phoneNumber.value || phoneNumber.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
  uni.showToast({ title: '验证码已发送', icon: 'none' })
}

function confirmPhoneLogin() {
  if (!phoneNumber.value || !smsCode.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  closePhoneModal()
  doLogin('phone-code', { nickName: '用户' })
  goToHome()
}

function showVisitorMode() {
  uni.setStorageSync('nickname', '小小体验者')
  uni.showToast({ title: '已以游客身份体验', icon: 'none' })
  goToHome()
}

function openAgreement(type) {
  uni.showModal({
    title: type === 'user' ? '用户协议' : '隐私政策',
    content: type === 'user'
      ? '这里是用户协议内容...（实际接入时填充）'
      : '这里是隐私政策内容...（实际接入时填充）',
    showCancel: false,
    confirmText: '我已知晓'
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #E8EFFF 0%, #F0F7FF 50%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 $spacing-lg;
  position: relative;
  overflow: hidden;
}

/* 装饰圆 */
.top-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;

  &.circle-1 {
    width: 500rpx;
    height: 500rpx;
    background: $brand-purple;
    top: -200rpx;
    right: -100rpx;
  }

  &.circle-2 {
    width: 300rpx;
    height: 300rpx;
    background: $brand-blue;
    top: 50rpx;
    left: -100rpx;
  }
}

/* Logo区 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(120rpx + constant(safe-area-inset-top));
  padding-top: calc(120rpx + env(safe-area-inset-top));
  gap: $spacing-lg;
}

.frog-logo {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12rpx); }
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.brand-name {
  font-size: 56rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: 4rpx;
}

.brand-slogan {
  font-size: 30rpx;
  color: $text-secondary;
}

/* 功能介绍 */
.features-section {
  margin-top: $spacing-xl * 2;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  width: 100%;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-lg;
  border: 1rpx solid rgba(255,255,255,0.6);
}

.feature-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.feature-text {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}

/* 登录区 */
.login-section {
  margin-top: auto;
  width: 100%;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.btn-wechat {
  width: 100%;
  height: 96rpx;
  background: #07C160;
  border: none;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
  font-size: 32rpx;
  font-weight: 600;
  color: white;

  &::after { border: none; }

  &.loading {
    opacity: 0.7;
  }

  .wechat-icon { font-size: 40rpx; }
}

.youth-note {
  display: flex;
  align-items: flex-start;
  gap: $spacing-xs;
  padding: 0 $spacing-xs;

  .note-icon { font-size: 24rpx; flex-shrink: 0; margin-top: 2rpx; }
  .note-text {
    font-size: 22rpx;
    color: $text-hint;
    line-height: 1.5;
  }
}

/* 分割线 */
.divider-row {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  .divider-line {
    flex: 1;
    height: 1rpx;
    background: $border-color;
  }

  .divider-text {
    font-size: 24rpx;
    color: $text-hint;
    flex-shrink: 0;
  }
}

/* 其他登录 */
.other-login {
  display: flex;
  justify-content: center;
  gap: $spacing-xl * 2;
}

.other-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  -webkit-tap-highlight-color: transparent;

  .other-icon { font-size: 48rpx; }
  .other-label {
    font-size: 24rpx;
    color: $text-secondary;
  }
}

/* 底部协议 */
.bottom-agreements {
  position: absolute;
  bottom: calc(30rpx + constant(safe-area-inset-bottom));
  bottom: calc(30rpx + env(safe-area-inset-bottom));
  left: $spacing-lg;
  right: $spacing-lg;
}

.agreement-check {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
}

.check-box {
  width: 36rpx;
  height: 36rpx;
  border: 3rpx solid $border-color;
  border-radius: 6rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rpx;
  transition: all 0.2s;

  &.checked {
    background: $brand-green;
    border-color: $brand-green;
  }

  .check-mark {
    font-size: 22rpx;
    color: white;
    font-weight: 700;
  }
}

.agreement-text {
  font-size: 22rpx;
  color: $text-hint;
  line-height: 1.5;
}

.link {
  color: $brand-blue;
}

/* 手机号弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}

.phone-modal {
  background: $bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  width: 100%;
  max-height: 70vh;
  padding-bottom: calc(constant(safe-area-inset-bottom) + 40rpx);
  padding-bottom: calc(env(safe-area-inset-bottom) + 40rpx);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1rpx solid $border-light;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $text-primary;
}

.modal-close {
  font-size: 36rpx;
  color: $text-hint;
  padding: $spacing-xs;
}

.modal-body {
  padding: $spacing-lg;
}

.phone-input-wrap {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  background: #F5F7FA;
  border-radius: $radius-lg;
  padding: 0 $spacing-md;
  height: 96rpx;
  margin-bottom: $spacing-md;
}

.country-code {
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 600;
  flex-shrink: 0;
}

.phone-input {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
  height: 100%;
}

.code-input-row {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.code-input {
  flex: 1;
  height: 96rpx;
  background: #F5F7FA;
  border-radius: $radius-lg;
  padding: 0 $spacing-md;
  font-size: 30rpx;
  color: $text-primary;
}

.send-code-btn {
  height: 96rpx;
  padding: 0 $spacing-lg;
  background: $brand-blue;
  color: white;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 600;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;

  &.disabled {
    background: $border-light;
    color: $text-hint;
  }
}

.w-full { width: 100%; }
.mt-md { margin-top: $spacing-md; }
</style>
