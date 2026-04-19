/**
 * Pinia Store - 用户模块
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ========== State ==========
  const token = ref('')
  const userInfo = ref({
    id: '',
    openid: '',
    nickname: '',
    avatar: '',
    age: 0,
    role: 'child', // 'child' | 'parent'
    parentId: '',
    parentCode: '',
    subscription: {
      plan: 'free',
      startDate: null,
      endDate: null,
      autoRenew: false
    },
    stats: {
      totalSessions: 0,
      totalMinutes: 0,
      totalStars: 0,
      streakDays: 0,
      lastPracticeDate: null
    }
  })

  // ========== Getters ==========
  const isLoggedIn = computed(() => !!token.value)
  const isVIP = computed(() => userInfo.value.subscription.plan !== 'free')
  const isChild = computed(() => userInfo.value.role === 'child')
  const isParent = computed(() => userInfo.value.role === 'parent')

  // ========== Actions ==========

  /**
   * 设置Token
   */
  function setToken(newToken) {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  /**
   * 设置用户信息
   */
  function setUserInfo(info) {
    userInfo.value = { ...userInfo.value, ...info }
  }

  /**
   * 微信登录
   */
  async function wechatLogin() {
    try {
      // 1. 获取微信登录code
      const { code } = await uni.login({ provider: 'weixin' })

      // 2. 发送到后端换取Token
      const res = await uni.request({
        url: 'https://api.dinggg.com/api/auth/login',
        method: 'POST',
        data: { code }
      })

      if (res.data.code === 0) {
        setToken(res.data.data.token)
        setUserInfo(res.data.data.user)
        return true
      } else {
        uni.showToast({ title: res.data.message || '登录失败', icon: 'none' })
        return false
      }
    } catch (err) {
      console.error('登录失败:', err)
      uni.showToast({ title: '网络错误', icon: 'none' })
      return false
    }
  }

  /**
   * 获取用户资料
   */
  async function fetchProfile() {
    if (!token.value) return false

    try {
      const res = await uni.request({
        url: 'https://api.dinggg.com/api/auth/profile',
        method: 'GET',
        header: { Authorization: `Bearer ${token.value}` }
      })

      if (res.data.code === 0) {
        setUserInfo(res.data.data)
        return true
      }
      return false
    } catch (err) {
      console.error('获取资料失败:', err)
      return false
    }
  }

  /**
   * 退出登录
   */
  function logout() {
    token.value = ''
    userInfo.value = {}
    uni.removeStorageSync('token')
  }

  /**
   * 初始化（从本地存储恢复）
   */
  function init() {
    const savedToken = uni.getStorageSync('token')
    if (savedToken) {
      token.value = savedToken
    }
  }

  return {
    // State
    token,
    userInfo,
    // Getters
    isLoggedIn,
    isVIP,
    isChild,
    isParent,
    // Actions
    setToken,
    setUserInfo,
    wechatLogin,
    fetchProfile,
    logout,
    init
  }
})
