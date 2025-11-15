# Multi-stage build for SweatyDudes application

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use legacy-peer-deps due to React 19 compatibility requirements
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
# - vite build: compiles React frontend to dist/public/
# - esbuild: bundles Express backend to dist/index.js
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

# Install runtime dependencies only
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    tini

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
# Still need --legacy-peer-deps for React 19
RUN npm ci --legacy-peer-deps --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
COPY --from=builder /app/shared ./shared

# Create data directory for SQLite (if needed)
RUN mkdir -p /app/data && chmod 777 /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/index.js"]
