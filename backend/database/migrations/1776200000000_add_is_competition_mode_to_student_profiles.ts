import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_profiles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_competition_mode').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_competition_mode')
    })
  }
}
