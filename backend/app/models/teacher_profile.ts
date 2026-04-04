import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import type { MartialArtExperience } from '#models/student_profile'

export default class TeacherProfile extends BaseModel {
  static table = 'teacher_profiles'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column({
    prepare: (value: MartialArtExperience[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | MartialArtExperience[] | null) => {
      if (!value) return null
      if (typeof value === 'string') return JSON.parse(value) as MartialArtExperience[]
      return value
    },
  })
  declare fightExperience: MartialArtExperience[] | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
