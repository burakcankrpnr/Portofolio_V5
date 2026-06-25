FROM node:latest

# Gerekli kütüphaneleri yükle (OpenSSL ve diğer bağımlılıklar)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Package files
COPY package*.json ./
COPY prisma ./prisma

# Install ALL dependencies (legacy-peer-deps ile dependency conflict çözülüyor)
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy source
COPY . .

# Build-time environment variables (geçici değerler, runtime'da override edilecek)
# Bu değerler sadece build için, runtime'da docker-compose.yml'den gerçek değerler gelecek
ARG NEXTAUTH_SECRET=BUILD_TIME_PLACEHOLDER_DO_NOT_USE_IN_PRODUCTION
ARG NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

# Build the application (NODE_ENV production for build)
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Copy and make entrypoint executable
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Production port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Use entrypoint script
CMD ["./docker-entrypoint.sh"]
