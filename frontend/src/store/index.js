/**
 * Pinia Store - 用户模块
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ========== State ==========
  const token = ref('')
  const userInfo = ref({
    id: 'test123',
    openid: 'test_openid',
    nickname: '小明',
    avatar: '',
    age: 10,
    role: 'child',
    parentId: '',
    parentCode: '',
    subscription: {
      plan: 'free',
      startDate: null,
      endDate: null,
      autoRenew: false
    },
    stats: {
      totalSessions: 5,
      totalMinutes: 30,
      totalStars: 128,
      streakDays: 7,
      lastPracticeDate: new Date().toISOString()
    }
  })

  // ========== Getters ==========
  const isLoggedIn = computed(() => true) // 始终返回true用于测试
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
   * 模拟登录（用于测试）
   */
  async function mockLogin() {
    try {
      setToken('mock_token_12345')
      uni.setStorageSync('token', 'mock_token_12345')
      uni.setStorageSync('nickname', userInfo.value.nickname)
      uni.setStorageSync('stars', userInfo.value.stats.totalStars)
      return true
    } catch (err) {
      console.error('模拟登录失败:', err)
      return false
    }
  }

  /**
   * 微信登录（正式版本）
   */
  async function wechatLogin() {
    try {
      const { code } = await uni.login({ provider: 'weixin' })
      const res = await uni.request({
        url: 'http://162.14.75.65/api/auth/login',
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
        url: 'http://162.14.75.65/api/auth/profile',
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
   * 初始化
   */
  function init() {
    const savedToken = uni.getStorageSync('token')
    if (savedToken) {
      token.value = savedToken
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isVIP,
    isChild,
    isParent,
    setToken,
    setUserInfo,
    mockLogin,
    wechatLogin,
    fetchProfile,
    logout,
    init
  }
})
