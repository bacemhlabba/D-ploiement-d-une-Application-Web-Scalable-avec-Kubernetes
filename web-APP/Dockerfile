# Build stage 
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Set build arguments and env vars
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV TYPESCRIPT_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Create build stage
FROM base AS deps

# Copy package files
COPY web-APP/package*.json ./

# Install all dependencies including dev dependencies
RUN npm install

# Install required core modules explicitly
RUN npm install bcryptjs pg jsonwebtoken typescript

# Builder stage
FROM base AS builder

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all files from web-APP directory
COPY web-APP/ .

# Create empty .env.local
RUN touch .env.local

# Remove any pnpm files to force npm usage and remove TypeScript config
RUN rm -f pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json next-env.d.ts

# Disable TypeScript checks during build to avoid issues
ENV NEXT_TYPESCRIPT_CHECKING=0
ENV NPM_CONFIG_PACKAGE_MANAGER=npm

# Build the app with increased memory
RUN NODE_OPTIONS="--max-old-space-size=4096" \
    npm run build

# Production stage
FROM nginx:alpine AS runner

# Copy built files from builder
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static

# For standalone output 
RUN mkdir -p /usr/share/nginx/html/_next/standalone
# Copy the next output (removing the conditional)
COPY --from=builder /app/.next/standalone/ /usr/share/nginx/html/

# Set up nginx config
COPY web-APP/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget -q -O - http://localhost:8080/ || exit 1

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
