exports.up = function(knex) {
  return knex.schema.createTable('certificates', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('course_id').unsigned().notNullable();
    table.string('certificate_id').unique().notNullable();
    table.date('issued_date').notNullable();
    table.string('pdf_path'); // optional for storing filename
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('course_id').references('id').inTable('courses').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('certificates');
};
