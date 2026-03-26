const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', '..', '.env'),
});

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
};

const sharedConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secure_hrms_local',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: parseBoolean(process.env.DB_LOGGING, false),
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
  timezone: '+00:00',
  pool: {
    min: Number(process.env.DB_POOL_MIN || 0),
    max: Number(process.env.DB_POOL_MAX || 10),
    idle: Number(process.env.DB_POOL_IDLE_MS || 10000),
    acquire: Number(process.env.DB_POOL_ACQUIRE_MS || 30000),
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: false,
  },
};

module.exports = {
  development: sharedConfig,
  test: {
    ...sharedConfig,
    database: `${sharedConfig.database}_test`,
  },
  production: sharedConfig,
};
