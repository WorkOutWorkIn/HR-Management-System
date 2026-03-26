/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payroll_records', 'sequence_number', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('payroll_records', 'original_payroll_record_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'payroll_records',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('payroll_records', 'correction_reason', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.removeIndex('payroll_records', 'payroll_records_user_month_unique');
    await queryInterface.addIndex('payroll_records', ['user_id', 'payroll_month', 'sequence_number'], {
      unique: true,
      name: 'payroll_records_user_month_sequence_unique',
    });
    await queryInterface.addIndex('payroll_records', ['original_payroll_record_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('payroll_records', 'payroll_records_user_month_sequence_unique');
    await queryInterface.removeIndex('payroll_records', ['original_payroll_record_id']);
    await queryInterface.addIndex('payroll_records', ['user_id', 'payroll_month'], {
      unique: true,
      name: 'payroll_records_user_month_unique',
    });
    await queryInterface.removeColumn('payroll_records', 'correction_reason');
    await queryInterface.removeColumn('payroll_records', 'original_payroll_record_id');
    await queryInterface.removeColumn('payroll_records', 'sequence_number');
  },
};
