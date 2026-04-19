<template>
  <view id="app">
    <view class="app-container">
      <!-- 路由页面 -->
      <slot />
    </view>

    <!-- 底部 TabBar（全局） -->
    <view class="tabbar" v-if="showTabbar">
      <view
        v-for="tab in tabs"
        :key="tab.pagePath"
        class="tabbar-item"
        :class="{ active: currentTab === tab.pagePath }"
        @tap="switchTab(tab.pagePath)"
      >
        <text class="tabbar-icon">{{ tab.icon }}</text>
        <text class="tabbar-label">{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const tabs = [
  { pagePath: '/pages/index/index', icon: '🏠', label: '首页' },
  { pagePath: '/pages/parent/index', icon: '📊', label: '家长' },
  { pagePath: '/pages/achievement/index', icon: '🏆', label: '成就' },
  { pagePath: '/pages/mine/index', icon: '👤', label: '我的' }
]

const currentTab = ref('/pages/index/index')

const showTabbar = computed(() => {
  return ['/pages/index/index', '/pages/parent/index', '/pages/achievement/index', '/pages/mine/index'].includes(currentTab.value)
})

function switchTab(path) {
  currentTab.value = path
  uni.switchTab({ url: path })
}

onMounted(() => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    currentTab.value = `/${currentPage.route}`
  }
})
</script>

<style lang="scss">
// 全局样式已在 main.js 中通过 import './styles/global.scss' 引入
.app-container {
  min-height: 100vh;
}
</style>
