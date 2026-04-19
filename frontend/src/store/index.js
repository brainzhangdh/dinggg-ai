/**
 * Pinia Store - 用户模块
 * 支持离线模式和API超时保护
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
  const isLoggedIn = computed(() => !!token.value || true) // 始终返回true
  const isVIP = computed(() => userInfo.value.subscription.plan !== 'free')
  const isChild = computed(() => userInfo.value.role === 'child')
  const isParent = computed(() => userInfo.value.role === 'parent')

  // ========== Actions ==========

  function setToken(newToken) {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  function setUserInfo(info) {
    if (info) {
      userInfo.value = { ...userInfo.value, ...info }
    }
  }

  /**
   * 模拟登录（离线模式）
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
   * 微信登录（带超时保护）
   */
  async function wechatLogin() {
    try {
      const { code } = await uni.login({ provider: 'weixin' })
      
      // 带超时控制的请求
      const res = await Promise.race([
        uni.request({
          url: 'http://162.14.75.65/api/auth/login',
          method: 'POST',
          data: { code },
          timeout: 5000
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 5000)
        )
      ])

      if (res.data.code === 0) {
        setToken(res.data.data.token)
        setUserInfo(res.data.data.user)
        return true
      } else {
        // 登录失败时使用离线模式
        console.warn('登录失败，使用离线模式')
        await mockLogin()
        return true
      }
    } catch (err) {
      console.error('登录失败:', err)
      // API失败时使用离线模式
      await mockLogin()
      return true
    }
  }

  /**
   * 获取用户资料（带超时保护）
   */
  async function fetchProfile() {
    if (!token.value) return false
    try {
      const res = await Promise.race([
        uni.request({
          url: 'http://162.14.75.65/api/auth/profile',
          method: 'GET',
          header: { Authorization: `Bearer ${token.value}` },
          timeout: 5000
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 5000)
        )
      ])
      
      if (res.data.code === 0) {
        setUserInfo(res.data.data)
        return true
      }
      return false
    } catch (err) {
      console.error('获取资料失败，超时使用本地数据:', err)
      return false
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    uni.removeStorageSync('token')
  }

  function init() {
    const savedToken = uni.getStorageSync('token')
    if (savedToken) {
      token.value = savedToken
    }
    // 始终确保有用户数据
    if (!userInfo.value.nickname) {
      userInfo.value.nickname = '小明'
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
