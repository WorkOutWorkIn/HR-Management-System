/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payroll_records', {
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
      payroll_month: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      base_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      deduction_label: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      deduction_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      net_pay: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      generated_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('payroll_records', ['user_id']);
    await queryInterface.addIndex('payroll_records', ['payroll_month']);
    await queryInterface.addIndex('payroll_records', ['generated_by_user_id']);
    await queryInterface.addIndex('payroll_records', ['user_id', 'payroll_month'], {
      unique: true,
      name: 'payroll_records_user_month_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payroll_records');
  },
};
