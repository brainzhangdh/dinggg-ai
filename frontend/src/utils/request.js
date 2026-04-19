/**
 * 通用请求工具
 * 基于 uni.request 封装
 */

const BASE_URL = 'https://api.dinggg.com'

/**
 * 请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    const defaultOptions = {
      url: BASE_URL + options.url,
      timeout: 30000,
      header: {
        'Content-Type': 'application/json',
        'X-Platform': 'miniprogram',
        ...options.header
      },
      ...options
    }

    // 添加Token
    if (token) {
      defaultOptions.header.Authorization = `Bearer ${token}`
    }

    uni.request({
      ...defaultOptions,
      success: (res) => {
        const { statusCode, data } = res

        if (statusCode === 200) {
          if (data.code === 0) {
            resolve(data.data)
          } else if (data.code === 401) {
            // Token过期，跳转登录
            uni.removeStorageSync('token')
            uni.reLaunch({ url: '/pages/login/index' })
            reject(new Error('登录已过期'))
          } else {
            uni.showToast({
              title: data.message || '请求失败',
              icon: 'none'
            })
            reject(new Error(data.message))
          }
        } else {
          uni.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(new Error(`HTTP ${statusCode}`))
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * GET 请求
 */
export function get(url, params = {}, options = {}) {
  const queryString = new URLSearchParams(params).toString()
  const finalUrl = queryString ? `${url}?${queryString}` : url
  return request({
    url: finalUrl,
    method: 'GET',
    ...options
  })
}

/**
 * POST 请求
 */
export function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
export function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
export function del(url, options = {}) {
  return request({
    url,
    method: 'DELETE',
    ...options
  })
}

/**
 * 文件上传
 */
export function upload(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header: {
        Authorization: token ? `Bearer ${token}` : '',
        'X-Platform': 'miniprogram'
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 0) {
          resolve(data.data)
        } else {
          uni.showToast({ title: data.message || '上传失败', icon: 'none' })
          reject(new Error(data.message))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default {
  get,
  post,
  put,
  del,
  upload,
  request
}
