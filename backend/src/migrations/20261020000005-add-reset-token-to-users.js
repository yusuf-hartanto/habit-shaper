'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'reset_password_token_hash', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'reset_password_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('users', ['reset_password_token_hash'], {
      name: 'users_reset_password_token_hash_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_reset_password_token_hash_idx');
    await queryInterface.removeColumn('users', 'reset_password_expires_at');
    await queryInterface.removeColumn('users', 'reset_password_token_hash');
  },
};
