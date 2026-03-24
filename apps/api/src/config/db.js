import { Sequelize } from 'sequelize';
import env from './env.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.db.logging ? console.log : false,
  benchmark: env.db.logging,
  timezone: '+00:00',
  pool: env.db.pool,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: false,
  },
});

export async function testDatabaseConnection() {
  await sequelize.authenticate();
  console.log('Database connection verified');
}

export default sequelize;
