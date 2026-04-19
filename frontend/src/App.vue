<template>
  <view id="app">
    <!-- 全局样式 -->
    <view class="app-container">
      <!-- 路由页面将在这里渲染 -->
      <slot />
    </view>
  </view>
</template>

<script setup>
/**
 * 顶呱呱AI宝 - 微信小程序
 * App.vue - 应用入口
 */

// #ifdef MP-WEIXIN
// 微信小程序环境
// #endif

// #ifdef H5
// H5 环境
// #endif
</script>

<style lang="scss">
/* 全局样式 */
@import './styles/global.scss';

.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>
