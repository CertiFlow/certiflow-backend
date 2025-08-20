exports.up = function(knex) {
  return knex.schema.createTable('templates', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('filename').notNullable();
    table.integer('course_id').unsigned().references('id').inTable('courses').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('templates');
};
