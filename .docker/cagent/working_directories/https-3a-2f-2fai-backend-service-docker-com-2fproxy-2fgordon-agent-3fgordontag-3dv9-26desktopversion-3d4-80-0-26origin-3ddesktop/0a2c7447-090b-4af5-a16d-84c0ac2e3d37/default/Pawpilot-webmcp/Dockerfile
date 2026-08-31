FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration files
COPY package*.json tsconfig.json vite.config.ts ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Copy source files
COPY src ./src
COPY index.html ./
COPY schema.sql ./

# Build TypeScript backend and React frontend
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]
