# Image multi-étapes pour Next.js en production
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci || npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Créer un user non-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Dossier data pour SQLite (persistance) : monter un volume en prod
# Ex: docker run -v inoxya-data:/app/data ...
RUN mkdir -p /app/data && chown nextjs:nextjs /app/data

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs
# Volume persistant pour la base SQLite (recommandé en production)
VOLUME ["/app/data"]
CMD ["npm", "start"]


