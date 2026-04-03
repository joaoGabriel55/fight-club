import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enrollments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('class_id').notNullable().references('id').inTable('classes').onDelete('CASCADE')
      table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.enu('status', ['active', 'left']).notNullable().defaultTo('active')
      table.timestamp('joined_at').notNullable()
      table.timestamp('left_at').nullable()
      table.timestamp('data_consent_at').notNullable()

      table.unique(['class_id', 'student_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
