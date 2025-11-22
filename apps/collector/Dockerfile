# ====================
# Stage 1: Builder
# ====================
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Générer le Prisma Client
RUN npx prisma generate

# Build l'application collector
RUN npm run build collector

# ====================
# Stage 2: Production
# ====================
FROM node:18-alpine AS production

WORKDIR /app

# Installer dumb-init (pour gérer les signaux proprement)
RUN apk add --no-cache dumb-init

# Créer un user non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copier les dépendances de production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier Prisma schema et générer le client
COPY --chown=nestjs:nodejs prisma ./prisma/
RUN npx prisma generate

# Copier le build depuis le stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copier le script d'entrypoint
COPY --chown=nestjs:nodejs docker/collector-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/collector-entrypoint.sh

# Changer vers l'utilisateur non-root
USER nestjs

# Healthcheck (optionnel, pour monitoring)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Utiliser dumb-init pour gérer les signaux
ENTRYPOINT ["dumb-init", "--"]

# Lancer l'application via l'entrypoint script
CMD ["/usr/local/bin/collector-entrypoint.sh"]