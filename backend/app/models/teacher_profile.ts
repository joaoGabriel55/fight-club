import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class TeacherProfile extends BaseModel {
  static table = 'teacher_profiles'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare fightExperience: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
