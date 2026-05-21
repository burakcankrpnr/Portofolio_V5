FROM node:20-alpine AS build
EXPOSE 5173

RUN npm config set loglevel verbose --global
RUN apk add build-base cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs
USER nodejs
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
