import { PASSWORD_TOKEN_PURPOSES } from '../../constants/auth.js';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      purpose: {
        type: Sequelize.ENUM(...Object.values(PASSWORD_TOKEN_PURPOSES)),
        allowNull: false,
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      invalidated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      requested_by_ip: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('password_reset_tokens', ['user_id', 'purpose']);
    await queryInterface.addIndex('password_reset_tokens', ['expires_at']);
    await queryInterface.addIndex('password_reset_tokens', ['used_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('password_reset_tokens');
  },
};
