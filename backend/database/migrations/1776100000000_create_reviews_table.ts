import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('class_id').notNullable().references('id').inTable('classes').onDelete('CASCADE')
      table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('rating').notNullable()
      table.text('comment').nullable()
      table.date('session_date').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['class_id', 'student_id', 'session_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
