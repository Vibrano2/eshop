# ==============================================================================
# Stage 1: Build Frontend (Vite)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Cache package manifests
COPY package*.json ./
RUN npm ci

# Copy all source files and compile Vite SPA
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production Unified Server
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend server code and database initializers
COPY server/ ./server/
COPY public/ ./public/

# Copy compiled frontend from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3001

# Healthcheck for container orchestrators (Docker, Kubernetes, Cloud Run)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server/index.js"]
