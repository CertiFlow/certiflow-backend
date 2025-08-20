exports.up = function(knex) {
  return knex.schema.createTable('courses', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.string('level'); // e.g., beginner, advanced
    table.date('start_date');
    table.date('end_date');
    table.timestamps(true, true); // created_at & updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('courses');
};
