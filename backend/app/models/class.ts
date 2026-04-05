import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import ClassSchedule from '#models/class_schedule'
import Invitation from '#models/invitation'
import Enrollment from '#models/enrollment'
import Announcement from '#models/announcement'
import Review from '#models/review'

export default class Class extends BaseModel {
  static table = 'classes'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teacherId: string

  @column()
  declare name: string

  @column()
  declare martialArt: string

  @column()
  declare hasBeltSystem: boolean

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'teacherId' })
  declare teacher: BelongsTo<typeof User>

  @hasMany(() => ClassSchedule)
  declare schedules: HasMany<typeof ClassSchedule>

  @hasMany(() => Invitation)
  declare invitations: HasMany<typeof Invitation>

  @hasMany(() => Enrollment)
  declare enrollments: HasMany<typeof Enrollment>

  @hasMany(() => Announcement)
  declare announcements: HasMany<typeof Announcement>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>
}
