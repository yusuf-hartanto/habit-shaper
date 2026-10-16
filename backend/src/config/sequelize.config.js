// Sequelize CLI configuration (CommonJS so sequelize-cli can load it directly).
// Defaults mirror compose.yml so local and container runs behave the same.
const path = require('path');

require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const base = {
  username: process.env.DB_USER || 'habituser',
  password: process.env.DB_PASSWORD || 'habitpassword',
  database: process.env.DB_NAME || 'habit_shaper',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  timezone: '+00:00',
  migrationStorageTableName: 'sequelize_meta',
  define: {
    underscored: true,
    timestamps: true,
  },
  logging: false,
};

module.exports = {
  development: { ...base },
  test: { ...base, database: process.env.DB_NAME_TEST || `${base.database}_test` },
  production: { ...base },
};
