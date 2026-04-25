# =========================
# Build stage for frontend
# =========================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frondend

COPY frondend/package*.json ./
RUN npm install

COPY frondend/ ./
RUN npm run build


# =========================
# Backend + Runtime stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build results
COPY --from=frontend-builder /app/frondend/dist ./frondend/dist

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Setup Prisma and database directory
WORKDIR /app/backend
RUN mkdir -p data

# Environment variables
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV DATABASE_URL="file:./data/dev.db"

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
