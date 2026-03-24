/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'manager_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'created_by_user_id',
    });

    await queryInterface.addIndex('users', ['manager_user_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', ['manager_user_id']);
    await queryInterface.removeColumn('users', 'manager_user_id');
  },
};
