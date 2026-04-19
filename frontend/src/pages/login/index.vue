<!-- 顶呱呱AI宝 - 测试登录页 -->
<template>
  <view class="login-page">
    <view class="logo-section">
      <text class="logo-text">🐸 顶呱呱AI宝</text>
      <text class="slogan">学好英语少不了</text>
    </view>
    
    <view class="login-section">
      <button class="btn-test" @tap="handleTestLogin">快速体验（测试版）</button>
      <text class="hint">* 此版本跳过微信登录，直接体验全部功能</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/index'

const isLoading = ref(false)

async function handleTestLogin() {
  isLoading.value = true
  const userStore = useUserStore()
  await userStore.mockLogin()
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}
.logo-section {
  text-align: center;
  margin-bottom: 120rpx;
}
.logo-text {
  font-size: 56rpx;
  color: #fff;
  font-weight: bold;
}
.slogan {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 20rpx;
}
.login-section {
  width: 100%;
}
.btn-test {
  background: #fff;
  color: #667EEA;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 100rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}
.hint {
  font-size: 24rpx;
  color: rgba(255,255,255,0.6);
  text-align: center;
}
</style>
