// migrations/20250429011404_create_trainings_table.js

/**
 * Create the trainings table.
 */
exports.up = function(knex) {
  return knex.schema.createTable('trainings', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.timestamp('scheduled_at').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * Drop the trainings table.
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('trainings');
};
