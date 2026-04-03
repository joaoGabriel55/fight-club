import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'belt_progress'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('enrollment_id').notNullable().references('id').inTable('enrollments').onDelete('CASCADE')
      table.string('belt_name', 100).notNullable()
      table.timestamp('awarded_at').notNullable()
      table.uuid('awarded_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
