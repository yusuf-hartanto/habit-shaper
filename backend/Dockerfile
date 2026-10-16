# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Production stage ----------
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled app
COPY --from=build /app/dist ./dist
# sequelize-cli assets (plain CommonJS, not compiled)
COPY .sequelizerc ./
COPY src/config/sequelize.config.js ./src/config/sequelize.config.js
COPY src/migrations ./src/migrations

COPY entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh \
    && chown -R node:node /app

USER node
EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
