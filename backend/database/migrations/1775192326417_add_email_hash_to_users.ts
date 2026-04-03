import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Deterministic SHA-256 of the normalised email; used for duplicate
      // detection and login lookups without storing plaintext.
      table.string('email_hash', 64).nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_hash')
    })
  }
}
