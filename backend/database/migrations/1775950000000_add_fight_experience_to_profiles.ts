import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add fight_experience jsonb column to student_profiles
    this.schema.alterTable('student_profiles', (table) => {
      table.jsonb('fight_experience').nullable()
    })

    // Change teacher_profiles.fight_experience from string to jsonb
    this.schema.alterTable('teacher_profiles', (table) => {
      table.dropColumn('fight_experience')
    })
    this.schema.alterTable('teacher_profiles', (table) => {
      table.jsonb('fight_experience').nullable()
    })
  }

  async down() {
    this.schema.alterTable('student_profiles', (table) => {
      table.dropColumn('fight_experience')
    })

    this.schema.alterTable('teacher_profiles', (table) => {
      table.dropColumn('fight_experience')
    })
    this.schema.alterTable('teacher_profiles', (table) => {
      table.string('fight_experience').nullable()
    })
  }
}
