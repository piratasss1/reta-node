# ------------------------------
# 1) Dependencies layer (all dependencies including dev)
# ------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# ------------------------------
# 1b) Production dependencies only
# ------------------------------
FROM node:20-alpine AS deps-prod
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --only=production

# ------------------------------
# 2) Build layer (Prisma generate)
# ------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

RUN apk add --no-cache openssl
RUN npx prisma generate

# ------------------------------
# 3) Runtime layer
# ------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl

# Copiamos dependencias completas (incluyendo dev) para poder usar tsx
COPY --from=deps /app/node_modules ./node_modules

# Copiamos todo lo necesario
COPY prisma ./prisma
COPY package.json package-lock.json ./
COPY src ./src
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
