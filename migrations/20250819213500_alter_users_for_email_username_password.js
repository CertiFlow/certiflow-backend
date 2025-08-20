// D:\CertiFlow\certiflow-backend\migrations\20250819213500_alter_users_for_email_username_password.js
/**
 * Ensure the users table supports:
 *  - name (student's display name)
 *  - email (unique) for pre-provision + invites
 *  - username (unique) student chooses on first setup
 *  - password_hash (nullable until the student sets a password)
 *  - role ('student' | 'instructor' | 'admin'), default 'student'
 *  - timestamps
 *
 * If the table doesn't exist, create it with these columns.
 * If it already exists, only add any missing columns (safe/idempotent).
 */
exports.up = async function up(knex) {
  const hasUsers = await knex.schema.hasTable('users');

  if (!hasUsers) {
    await knex.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('name').nullable();                 // display name
      t.string('email').notNullable().unique();    // pre-provision + login
      t.string('username').unique().nullable();    // student-chosen handle
      t.string('password_hash').nullable();        // null until they set it
      t.string('role').notNullable().defaultTo('student');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    return;
  }

  // Table exists — add any missing columns
  const addIfMissing = async (col, cb) => {
    const has = await knex.schema.hasColumn('users', col);
    if (!has) {
      await knex.schema.alterTable('users', cb);
    }
  };

  await addIfMissing('name', (t) => t.string('name').nullable());
  await addIfMissing('email', (t) => t.string('email').unique());
  await addIfMissing('username', (t) => t.string('username').unique().nullable());
  await addIfMissing('password_hash', (t) => t.string('password_hash').nullable());
  await addIfMissing('role', (t) => t.string('role').defaultTo('student'));
  await addIfMissing('created_at', (t) => t.timestamp('created_at').defaultTo(knex.fn.now()));
  await addIfMissing('updated_at', (t) => t.timestamp('updated_at').defaultTo(knex.fn.now()));
};

exports.down = async function down() {
  // No destructive down to avoid data loss.
};
