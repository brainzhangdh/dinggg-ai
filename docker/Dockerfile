# ============================================
# 顶呱呱AI宝 - 后端服务 Dockerfile
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# ============================================
# 生产镜像
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 复制源码
COPY --chown=nodejs:nodejs . .

# 创建日志目录
RUN mkdir -p logs && chown -R nodejs:nodejs .

# 切换用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/app.js"]
