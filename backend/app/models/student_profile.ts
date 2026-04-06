import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'

export interface MartialArtExperience {
  martial_art: string
  experience_years: number
  belt_level?: string | null
  competition_level?: 'amateur' | 'professional' | null
}

export default class StudentProfile extends BaseModel {
  static table = 'student_profiles'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare weightKg: string | null

  @column()
  declare heightCm: string | null

  @column({
    prepare: (value: MartialArtExperience[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | MartialArtExperience[] | null) => {
      if (!value) return null
      if (typeof value === 'string') return JSON.parse(value) as MartialArtExperience[]
      return value
    },
  })
  declare fightExperience: MartialArtExperience[] | null

  @column.dateTime()
  declare dataConsentAt: DateTime | null

  @column()
  declare isCompetitionMode: boolean

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
