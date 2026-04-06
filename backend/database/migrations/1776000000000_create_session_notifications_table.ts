import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'session_notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table
        .uuid('enrollment_id')
        .notNullable()
        .references('id')
        .inTable('enrollments')
        .onDelete('CASCADE')
      table.date('session_date').notNullable()
      table.string('notification_type').notNullable()
      table.timestamp('sent_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.unique(['enrollment_id', 'session_date', 'notification_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
