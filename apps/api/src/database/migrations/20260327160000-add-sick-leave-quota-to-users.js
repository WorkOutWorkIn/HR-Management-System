export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'sick_leave_quota', {
    type: Sequelize.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 14,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'sick_leave_quota');
}
