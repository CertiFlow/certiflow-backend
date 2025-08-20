// D:\CertiFlow\certiflow-backend\migrations\20250819220000_users_password_nullable.js
/**
 * Some earlier schema versions used a NOT NULL "password" column.
 * Pre-provisioning creates users WITHOUT a password initially,
 * so we must allow NULL here.
 */
exports.up = async function up(knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  const hasPassword = await knex.schema.hasColumn('users', 'password');
  if (hasPassword) {
    // Drop NOT NULL constraint if present
    await knex.raw('ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL');
  }
};

exports.down = async function down(knex) {
  // No-op (don’t re-enforce NOT NULL)
};
