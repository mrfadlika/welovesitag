# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frondend
COPY frondend/package*.json ./
RUN npm install
COPY frondend/ ./
RUN npm run build

# Stage for backend
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build results
COPY --from=frontend-builder /app/frondend/dist ./frondend/dist

# Setup Prisma and database directory
WORKDIR /app/backend
RUN mkdir -p data
RUN npx prisma generate

# Environment variables
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV DATABASE_URL="file:./data/dev.db"

EXPOSE 3000

# Script to run migrations and start
CMD npx prisma migrate deploy && npm start
