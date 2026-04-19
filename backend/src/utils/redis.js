/**
 * Redis 客户端
 */

const Redis = require('ioredis')
const logger = require('./logger')

let redis = null

/**
 * 连接Redis
 */
async function connectRedis() {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3
    })

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully')
    })

    redis.on('error', (err) => {
      logger.error('❌ Redis error:', err)
    })

    // 测试连接
    await redis.ping()
    return redis
  } catch (error) {
    logger.error('❌ Redis connection failed:', error)
    // Redis连接失败不影响主服务
    return null
  }
}

/**
 * 获取Redis客户端
 */
function getRedis() {
  return redis
}

/**
 * 设置带过期时间的键
 */
async function setEx(key, value, seconds) {
  if (!redis) return null
  return redis.setex(key, seconds, JSON.stringify(value))
}

/**
 * 获取键值
 */
async function get(key) {
  if (!redis) return null
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

/**
 * 删除键
 */
async function del(key) {
  if (!redis) return null
  return redis.del(key)
}

/**
 * 哈希设置
 */
async function hSet(key, field, value) {
  if (!redis) return null
  return redis.hset(key, field, JSON.stringify(value))
}

/**
 * 哈希获取
 */
async function hGet(key, field) {
  if (!redis) return null
  const value = await redis.hget(key, field)
  return value ? JSON.parse(value) : null
}

/**
 * 哈希获取所有
 */
async function hGetAll(key) {
  if (!redis) return null
  const data = await redis.hgetall(key)
  const result = {}
  for (const [k, v] of Object.entries(data)) {
    result[k] = JSON.parse(v)
  }
  return result
}

/**
 * 自增
 */
async function incr(key) {
  if (!redis) return null
  return redis.incr(key)
}

/**
 * 设置过期时间
 */
async function expire(key, seconds) {
  if (!redis) return null
  return redis.expire(key, seconds)
}

module.exports = {
  connectRedis,
  getRedis,
  setEx,
  get,
  del,
  hSet,
  hGet,
  hGetAll,
  incr,
  expire
}
