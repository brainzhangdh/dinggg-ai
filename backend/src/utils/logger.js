/**
 * 日志工具 - Winston
 */

const winston = require('winston')
const path = require('path')

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level}: ${message}\n${stack}`
    }
    return `[${timestamp}] ${level}: ${message}`
  })
)

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  logFormat
)

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
})

// 生产环境添加文件输出
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(process.env.LOG_DIR || './logs', 'error.log'),
    level: 'error'
  }))
  logger.add(new winston.transports.File({
    filename: path.join(process.env.LOG_DIR || './logs', 'combined.log')
  }))
}

module.exports = logger
