FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./

# Try multiple approaches for dependency installation
RUN npm config set registry https://registry.npmjs.org/ && \
    (npm install --no-optional --no-audit || \
     (npm config set registry https://registry.npmmirror.com/ && npm install --no-optional) || \
     (rm -rf node_modules package-lock.json && npm install --no-package-lock))

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3123
ENV HOSTNAME=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./

EXPOSE 3123
CMD ["npm", "start"]