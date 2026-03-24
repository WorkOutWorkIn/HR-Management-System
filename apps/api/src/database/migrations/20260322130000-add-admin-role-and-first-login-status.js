/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('EMPLOYEE', 'MANAGER', 'ADMIN')
      NOT NULL DEFAULT 'EMPLOYEE'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN status ENUM('PENDING_SETUP', 'PENDING_FIRST_LOGIN', 'ACTIVE', 'LOCKED', 'DISABLED')
      NOT NULL DEFAULT 'PENDING_FIRST_LOGIN'
    `);

    await queryInterface.sequelize.query(`
      UPDATE users
      SET status = 'PENDING_FIRST_LOGIN'
      WHERE status = 'PENDING_SETUP'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN status ENUM('PENDING_FIRST_LOGIN', 'ACTIVE', 'LOCKED', 'DISABLED')
      NOT NULL DEFAULT 'PENDING_FIRST_LOGIN'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN status ENUM('PENDING_SETUP', 'PENDING_FIRST_LOGIN', 'ACTIVE', 'LOCKED', 'DISABLED')
      NOT NULL DEFAULT 'PENDING_SETUP'
    `);

    await queryInterface.sequelize.query(`
      UPDATE users
      SET status = 'PENDING_SETUP'
      WHERE status = 'PENDING_FIRST_LOGIN'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN status ENUM('PENDING_SETUP', 'ACTIVE', 'LOCKED', 'DISABLED')
      NOT NULL DEFAULT 'PENDING_SETUP'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('EMPLOYEE', 'MANAGER')
      NOT NULL DEFAULT 'EMPLOYEE'
    `);
  },
};
