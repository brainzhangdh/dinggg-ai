/**
 * AI服务 - MiniMax API对接
 * 支持 ASR语音识别 -> LLM对话 -> TTS语音合成 完整链路
 */

const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const logger = require('../utils/logger')
const { hSet, hGet, expire } = require('../utils/redis')

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat'
const MINIMAX_API_HOST = process.env.MINIMAX_API_HOST || 'api.minimax.chat'

class AIService {
  /**
   * ASR 语音识别
   * 将英文语音转换为文字
   * 
   * @param {string} audioBase64 - 音频Base64编码
   * @param {string} language - 语言boost，默认英语
   * @returns {Promise<{text: string, taskId: string}>}
   */
  static async asr(audioBase64, language = 'en') {
    if (!audioBase64) {
      throw new Error('音频数据不能为空')
    }

    try {
      const requestId = uuidv4()

      // MiniMax ASR/T2A接口
      const response = await axios.post(
        `${MINIMAX_BASE_URL}/v1/t2a_async`,
        {
          model: 'speech-01',
          text: 'This is a speech recognition request',
          audio_file: audioBase64,
          stream: false,
          language_boost: language
        },
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Request-Id': requestId
          },
          timeout: 30000
        }
      )

      const { audio_file, task_id } = response.data || {}

      return {
        text: audio_file || '',
        taskId: task_id || requestId
      }
    } catch (error) {
      logger.error('ASR error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(`语音识别失败: ${error.message}`)
    }
  }

  /**
   * LLM 对话生成
   * 核心AI对话接口，支持上下文
   * 
   * @param {Object} params
   * @param {Object} params.scene - 场景对象
   * @param {string} params.userText - 用户输入文字
   * @param {Array} params.history - 历史消息
   * @returns {Promise<{reply: string, correction: Object, stars: number, audioUrl: string}>}
   */
  static async chat({ scene, userText, history = [] }) {
    if (!userText) {
      throw new Error('用户输入不能为空')
    }

    try {
      // 构建消息历史
      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(scene)
        }
      ]

      // 添加历史消息（最近10轮）
      const recentHistory = history.slice(-10)
      recentHistory.forEach(msg => {
        if (msg.role === 'user' && msg.userText) {
          messages.push({ role: 'user', content: msg.userText })
        }
        if (msg.role === 'assistant' && msg.aiText) {
          messages.push({ role: 'assistant', content: msg.aiText })
        }
      })

      // 添加当前用户消息
      messages.push({ role: 'user', content: userText })

      // 调用LLM
      const result = await this.llm({
        messages,
        temperature: 0.7,
        maxTokens: 300
      })

      // 如果有音频URL，直接返回
      if (result.audioUrl) {
        return result
      }

      // 否则尝试合成TTS
      let audioUrl = ''
      try {
        const ttsResult = await this.tts({ text: result.reply })
        audioUrl = ttsResult.audioUrl || ttsResult.base64 || ''
      } catch (ttsError) {
        logger.warn('TTS generation failed, returning text only:', ttsError.message)
        // TTS失败不影响对话返回
      }

      return {
        ...result,
        audioUrl
      }
    } catch (error) {
      logger.error('Chat error:', error)
      throw new Error(`对话生成失败: ${error.message}`)
    }
  }

  /**
   * LLM API调用
   * 
   * @param {Object} params
   * @param {Array} params.messages - 消息数组
   * @param {string} params.systemPrompt - 系统提示词
   * @param {number} params.temperature - 温度参数
   * @param {number} params.maxTokens - 最大token数
   * @returns {Promise<Object>}
   */
  static async llm({ messages, systemPrompt, temperature = 0.7, maxTokens = 200 }) {
    try {
      // 构建完整消息
      let fullMessages = [...messages]
      if (systemPrompt) {
        fullMessages.unshift({ role: 'system', content: systemPrompt })
      }

      const requestId = uuidv4()

      const response = await axios.post(
        `${MINIMAX_BASE_URL}/v1/chat/completions`,
        {
          model: 'abab6.5s',
          messages: fullMessages,
          temperature,
          max_tokens: maxTokens,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Request-Id': requestId
          },
          timeout: 30000
        }
      )

      const { choices } = response.data || {}
      const reply = choices?.[0]?.message?.content || ''

      // 解析回复（可能包含纠错信息JSON）
      return this.parseLLMResponse(reply)
    } catch (error) {
      logger.error('LLM error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(`LLM调用失败: ${error.message}`)
    }
  }

  /**
   * TTS 语音合成
   * 将文字转换为英文语音
   * 
   * @param {Object} params
   * @param {string} params.text - 要合成的文本
   * @param {string} params.voiceId - 音色ID
   * @param {number} params.speed - 语速
   * @returns {Promise<{audioUrl: string, taskId: string, base64: string}>}
   */
  static async tts({ text, voiceId = 'male-qn-qingse', speed = 0.85 }) {
    if (!text) {
      throw new Error('文本内容不能为空')
    }

    try {
      const taskId = uuidv4()
      const requestId = uuidv4()

      // 如果文本过长，分段处理
      const maxTextLength = 500
      let textToSynthesize = text
      if (text.length > maxTextLength) {
        textToSynthesize = text.substring(0, maxTextLength)
        logger.warn('TTS text truncated:', { original: text.length, truncated: maxTextLength })
      }

      const response = await axios.post(
        `${MINIMAX_BASE_URL}/v1/t2a`,
        {
          model: 'speech-01',
          text: textToSynthesize,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed,
            pitch: 0,
            vol: 1.0
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Request-Id': requestId
          },
          timeout: 60000
        }
      )

      const { audio_file, task_id } = response.data || {}

      return {
        audioUrl: audio_file || null,
        taskId: task_id || taskId,
        base64: audio_file || null
      }
    } catch (error) {
      logger.error('TTS error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(`语音合成失败: ${error.message}`)
    }
  }

  /**
   * 查询TTS任务状态
   * 用于异步TTS任务的轮询
   * 
   * @param {string} taskId - 任务ID
   * @returns {Promise<{status: string, audioUrl: string|null}>}
   */
  static async getTtsStatus(taskId) {
    try {
      const response = await axios.get(
        `${MINIMAX_BASE_URL}/v1/t2a_async/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      const { status, audio_file } = response.data || {}

      return {
        status: status || 'unknown',
        audioUrl: status === 'completed' ? audio_file : null
      }
    } catch (error) {
      logger.error('TTS status error:', error.message)
      throw new Error(`查询TTS状态失败: ${error.message}`)
    }
  }

  /**
   * 构建系统提示词
   * 根据场景配置构建AI角色设定
   */
  static buildSystemPrompt(scene) {
    if (!scene) {
      return this.getDefaultSystemPrompt()
    }

    // 合并场景系统提示词和默认设定
    const basePrompt = this.getDefaultSystemPrompt()
    const scenePrompt = scene.systemPrompt || ''

    return `${basePrompt}\n\n## Current Scene Context:\n${scenePrompt}`
  }

  /**
   * 默认系统提示词
   */
  static getDefaultSystemPrompt() {
    return `You are a friendly English tutor for children aged 6-18.
Your name is "DingDong" 🦄
- Speak slowly and use simple words for younger kids
- Be encouraging and warm
- When correcting errors, say "Great job! Little tip: ..."
- Never be harsh or negative
- Keep responses short (under 50 words per turn)
- Use emojis occasionally to keep it fun 🎉

## Response Format (IMPORTANT):
When responding, you can optionally include a JSON correction object like this at the end:
{"reply": "Your response text", "correction": {"hasError": false}, "stars": 1}

If the user makes a grammar or vocabulary mistake, gently correct them by including:
{"reply": "Your encouraging response", "correction": {"hasError": true, "originalPhrase": "mistake", "correctedPhrase": "correction", "tip": "Little tip explanation"}, "stars": 1}`
  }

  /**
   * 解析LLM回复
   * 处理可能包含JSON的回复
   */
  static parseLLMResponse(reply) {
    let parsedReply = reply.trim()
    let correction = null
    let stars = 1

    // 尝试解析JSON
    try {
      // 查找JSON部分（可能在文本之后）
      const jsonMatch = reply.match(/\{[\s\S]*"reply"[\s\S]*\}/)
      if (jsonMatch) {
        const jsonReply = JSON.parse(jsonMatch[0])
        parsedReply = jsonReply.reply || reply
        correction = jsonReply.correction || null
        stars = jsonReply.stars || 1
      }
    } catch {
      // 不是JSON格式，检查是否整个是JSON对象
      if (reply.startsWith('{') && reply.endsWith('}')) {
        try {
          const jsonReply = JSON.parse(reply)
          if (jsonReply.reply) {
            parsedReply = jsonReply.reply
            correction = jsonReply.correction || null
            stars = jsonReply.stars || 1
          }
        } catch {
          // 解析失败，使用原文
        }
      }
    }

    return {
      reply: parsedReply,
      correction,
      stars,
      raw: reply
    }
  }

  /**
   * 缓存对话上下文到Redis
   * 用于会话续接
   */
  static async cacheContext(sessionId, context) {
    try {
      const key = `session:context:${sessionId}`
      await hSet(key, 'data', JSON.stringify(context))
      await expire(key, 7200) // 2小时过期
      return true
    } catch (error) {
      logger.warn('Failed to cache context:', error.message)
      return false
    }
  }

  /**
   * 获取对话上下文
   */
  static async getContext(sessionId) {
    try {
      const key = `session:context:${sessionId}`
      const data = await hGet(key, 'data')
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.warn('Failed to get context:', error.message)
      return null
    }
  }
}

module.exports = AIService
