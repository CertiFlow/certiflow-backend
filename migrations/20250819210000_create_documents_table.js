// D:\CertiFlow\certiflow-backend\migrations\20250819210000_create_documents_table.js
/**
 * Creates a 'documents' table used by /api/documents endpoints.
 * Includes both student_id and user_id so existing code that references either will work.
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('documents', (table) => {
    table.increments('id').primary();
    table.integer('student_id').index().nullable();
    table.integer('user_id').index().nullable();     // some codepaths may use user_id
    table.integer('course_id').index().nullable();

    table.string('doc_type').nullable();             // e.g., waiver, ID, etc.
    table.string('original_name').nullable();        // original filename from upload
    table.string('filename').notNullable();          // stored filename on disk/S3
    table.string('mime_type').nullable();
    table.bigInteger('size').nullable();
    table.string('storage_path').nullable();         // local path or S3 key
    table.string('url').nullable();                  // optional public URL if using S3
    table.string('status').notNullable().defaultTo('uploaded');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('documents');
};
