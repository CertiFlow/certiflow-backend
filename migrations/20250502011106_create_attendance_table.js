exports.up = function(knex) {
  return knex.schema.createTable('attendance', function(table) {
    table.increments('id').primary();
    table.integer('enrollment_id').unsigned().notNullable();
    table.date('date').notNullable();
    table.boolean('attended').defaultTo(false);

    table.foreign('enrollment_id').references('id').inTable('enrollments').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance');
};
