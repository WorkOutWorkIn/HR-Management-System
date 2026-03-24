import env from '../../config/env.js';

const sharedConfig = {
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.db.logging,
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
  timezone: '+00:00',
  pool: env.db.pool,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: false,
  },
};

const config = {
  development: sharedConfig,
  test: {
    ...sharedConfig,
    database: `${env.db.name}_test`,
  },
  production: sharedConfig,
};

export default config;
