/**
 * 订阅支付路由
 */

const express = require('express')
const router = express.Router()
const User = require('../models/User')

/**
 * 获取会员方案列表
 * GET /api/subscription/plans
 */
router.get('/plans', async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'free',
        name: '免费版',
        price: 0,
        features: [
          '每日3次对话',
          '有广告干扰',
          '基础学习报告'
        ]
      },
      {
        id: 'monthly',
        name: '月度会员',
        price: 29,
        period: '月',
        originalPrice: 39,
        features: [
          '无限对话',
          '无广告干扰',
          '详细学习报告',
          '优先体验新功能'
        ]
      },
      {
        id: 'yearly',
        name: '年度会员',
        price: 199,
        period: '年',
        originalPrice: 299,
        recommended: true,
        features: [
          '无限对话',
          '无广告干扰',
          '专属年度总结报告',
          '优先体验新功能',
          '专属勋章'
        ]
      }
    ]

    res.json({
      code: 0,
      message: 'success',
      data: plans
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取当前会员状态
 * GET /api/subscription/status
 */
router.get('/status', async (req, res, next) => {
  try {
    // 需要从auth中间件获取用户，这里简化处理
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '请先登录',
        data: null
      })
    }

    // TODO: 从token获取用户
    res.json({
      code: 0,
      message: 'success',
      data: {
        plan: 'free',
        startDate: null,
        endDate: null,
        autoRenew: false
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 创建支付订单
 * POST /api/subscription/create-order
 */
router.post('/create-order', async (req, res, next) => {
  try {
    const { planId } = req.body

    if (!['monthly', 'yearly'].includes(planId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的套餐',
        data: null
      })
    }

    const prices = {
      monthly: 29,
      yearly: 199
    }

    const price = prices[planId]

    // TODO: 调用微信支付统一下单接口

    res.json({
      code: 0,
      message: '订单创建成功',
      data: {
        orderId: 'ORDER_' + Date.now(),
        prepayId: 'PREPAY_' + Date.now(),
        paymentParams: {
          // 微信支付参数
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 微信支付回调
 * POST /api/subscription/wx-callback
 */
router.post('/wx-callback', async (req, res, next) => {
  try {
    // TODO: 验证微信支付回调签名
    // TODO: 更新用户订阅状态

    res.send('success')
  } catch (error) {
    next(error)
  }
})

/**
 * 取消自动续费
 * POST /api/subscription/cancel
 */
router.post('/cancel', async (req, res, next) => {
  try {
    // TODO: 取消自动续费逻辑

    res.json({
      code: 0,
      message: '已取消自动续费',
      data: null
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
