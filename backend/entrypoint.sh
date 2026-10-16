#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx sequelize-cli db:migrate

echo "[entrypoint] Starting API server..."
exec node dist/index.js
