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

# Build l'application API
RUN npm run build api

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

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port de l'API
EXPOSE 3000

# Changer vers l'utilisateur non-root
USER nestjs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Utiliser dumb-init pour gérer les signaux
ENTRYPOINT ["dumb-init", "--"]

# Démarrer l'application
CMD ["node", "dist/apps/api/main.js"]
