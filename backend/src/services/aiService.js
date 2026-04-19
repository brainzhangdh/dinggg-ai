/**
 * AI服务 - MiniMax API对接
 */

const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const logger = require('../utils/logger')

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat'

class AIService {
  /**
   * ASR 语音识别
   */
  static async asr(audioBase64, language = 'en') {
    try {
      // 将Base64转为Buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64')

      const response = await axios.post(
        `${MINIMAX_BASE_URL}/v1/t2a_async`,
        {
          model: 'speech-01',
          audio_file: audioBuffer.toString('base64'),
          stream: false,
          language_boost: language
        },
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const { text, task_id } = response.data

      return {
        text: text || '',
        taskId: task_id
      }
    } catch (error) {
      logger.error('ASR error:', error.response?.data || error.message)
      throw new Error('语音识别失败')
    }
  }

  /**
   * LLM 对话生成
   */
  static async chat({ scene, userText, history = [] }) {
    try {
      // 构建消息历史
      const messages = [
        {
          role: 'system',
          content: scene.systemPrompt || this.getDefaultSystemPrompt()
        }
      ]

      // 添加历史消息
      history.forEach(msg => {
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
        maxTokens: 200
      })

      return result
    } catch (error) {
      logger.error('Chat error:', error)
      throw new Error('对话生成失败')
    }
  }

  /**
   * LLM API调用
   */
  static async llm({ messages, systemPrompt, temperature = 0.7, maxTokens = 200 }) {
    try {
      // 如果有systemPrompt，添加到消息开头
      const fullMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages

      const response = await axios.post(
        `${MINIMAX_BASE_URL}/v1/chat/completions`,
        {
          model: 'abab6.5s',
          messages: fullMessages,
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const { choices } = response.data
      const reply = choices?.[0]?.message?.content || ''

      // 解析回复（可能是JSON格式包含纠错信息）
      let parsedReply = reply
      let correction = null
      let stars = 1

      try {
        // 尝试解析JSON
        if (reply.startsWith('{')) {
          const jsonReply = JSON.parse(reply)
          parsedReply = jsonReply.reply || reply
          correction = jsonReply.correction || null
          stars = jsonReply.stars || 1
        }
      } catch {
        // 不是JSON，使用原文
      }

      return {
        reply: parsedReply,
        correction,
        stars,
        raw: reply
      }
    } catch (error) {
      logger.error('LLM error:', error.response?.data || error.message)
      throw new Error('LLM调用失败')
    }
  }

  /**
   * TTS 语音合成
   */
  static async tts({ text, voiceId = 'male-qn-qingse', speed = 0.85 }) {
    try {
      const taskId = uuidv4()

      const response = await axios.post(
        `${MINIMAX_BASE_URL}/v1/t2a`,
        {
          model: 'speech-01',
          text,
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
            'Content-Type': 'application/json'
          }
        }
      )

      // 返回音频URL或Base64
      const { audio_file, task_id } = response.data

      return {
        audioUrl: audio_file || null,
        taskId: task_id || taskId,
        base64: audio_file
      }
    } catch (error) {
      logger.error('TTS error:', error.response?.data || error.message)
      throw new Error('语音合成失败')
    }
  }

  /**
   * 查询TTS任务状态
   */
  static async getTtsStatus(taskId) {
    try {
      const response = await axios.get(
        `${MINIMAX_BASE_URL}/v1/t2a_async/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`
          }
        }
      )

      const { status, audio_file } = response.data

      return {
        status, // 'pending' | 'processing' | 'completed' | 'failed'
        audioUrl: status === 'completed' ? audio_file : null
      }
    } catch (error) {
      logger.error('TTS status error:', error)
      throw new Error('查询TTS状态失败')
    }
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
- Use emojis occasionally to keep it fun 🎉`
  }
}

module.exports = AIService
