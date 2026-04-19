/**
 * AI能力路由
 */

const express = require('express')
const router = express.Router()
const AIService = require('../services/aiService')
const logger = require('../utils/logger')

/**
 * 语音识别(ASR)
 * POST /api/ai/asr
 */
router.post('/asr', async (req, res, next) => {
  try {
    const { audioBase64, language } = req.body

    if (!audioBase64) {
      return res.status(400).json({
        code: 400,
        message: '缺少音频数据',
        data: null
      })
    }

    const result = await AIService.asr(audioBase64, language)

    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 对话生成(LLM)
 * POST /api/ai/llm
 */
router.post('/llm', async (req, res, next) => {
  try {
    const { messages, systemPrompt, temperature, maxTokens } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        code: 400,
        message: 'messages参数无效',
        data: null
      })
    }

    const result = await AIService.llm({
      messages,
      systemPrompt,
      temperature,
      maxTokens
    })

    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 语音合成(TTS)
 * POST /api/ai/tts
 */
router.post('/tts', async (req, res, next) => {
  try {
    const { text, voiceId, speed } = req.body

    if (!text) {
      return res.status(400).json({
        code: 400,
        message: '缺少文本内容',
        data: null
      })
    }

    const result = await AIService.tts({
      text,
      voiceId,
      speed
    })

    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 查询TTS任务状态
 * GET /api/ai/tts/:taskId
 */
router.get('/tts/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const result = await AIService.getTtsStatus(taskId)

    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
