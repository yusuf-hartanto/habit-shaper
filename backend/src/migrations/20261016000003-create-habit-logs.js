'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('habit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      habit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'habits', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      log_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      log_type: {
        type: Sequelize.ENUM('completed', 'relapse'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('habit_logs', ['habit_id', 'log_date', 'log_type'], {
      unique: true,
      name: 'habit_logs_habit_date_type_unique',
    });
    await queryInterface.addIndex('habit_logs', ['habit_id', 'log_date'], {
      name: 'habit_logs_habit_date_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('habit_logs');
  },
};
