# ==============================================================================
# HUMA HIJAB COLLECTION — ADMIN PANEL DOCKERFILE
# ==============================================================================

# Stage 1: Build Vite Single Page Application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts ./
RUN npm ci

COPY src ./src
COPY index.html ./

ARG VITE_API_URL
ARG VITE_STORE_NAME
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_STORE_NAME=${VITE_STORE_NAME}

RUN npm run build

# Stage 2: Production Nginx Web Server
FROM nginx:alpine AS runner

# Install curl for health check
RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
