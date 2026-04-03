import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('first_name').notNullable()
      table.text('last_name').nullable()
      table.text('email').notNullable().unique()
      table.string('password_hash').notNullable()
      table.text('birth_date').nullable()
      table.enum('profile_type', ['teacher', 'student']).notNullable()
      table.string('avatar_url').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
