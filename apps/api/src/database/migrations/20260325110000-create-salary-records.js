/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('salary_records', {
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
      base_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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

    await queryInterface.addIndex('salary_records', ['user_id']);
    await queryInterface.addIndex('salary_records', ['effective_date']);
    await queryInterface.addIndex('salary_records', ['user_id', 'effective_date'], {
      unique: true,
      name: 'salary_records_user_effective_date_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('salary_records');
  },
};
