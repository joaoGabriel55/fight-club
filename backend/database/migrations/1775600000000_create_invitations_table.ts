import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('class_id').notNullable().references('id').inTable('classes').onDelete('CASCADE')
      table
        .uuid('token')
        .notNullable()
        .unique()
        .defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.timestamp('expires_at').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('max_uses').nullable()
      table.integer('use_count').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
