# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# --- Production stage ---
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget -q --spider http://localhost/ || exit 1

# read_only ortamda entrypoint script'lerinin config dosyasını değiştirmesini önler
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
