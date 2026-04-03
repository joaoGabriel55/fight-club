import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('weight_kg').nullable()
      table.text('height_cm').nullable()
      table.timestamp('data_consent_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
