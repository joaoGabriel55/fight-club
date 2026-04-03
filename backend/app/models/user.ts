import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import encryption from '@adonisjs/core/services/encryption'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import StudentProfile from '#models/student_profile'
import TeacherProfile from '#models/teacher_profile'
import Enrollment from '#models/enrollment'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password_hash',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare firstName: string

  @column({
    prepare: (value: string | null) => (value ? encryption.encrypt(value) : null),
    consume: (value: string | null) => (value ? (encryption.decrypt(value) as string) : null),
  })
  declare lastName: string | null

  @column({
    prepare: (value: string | null) => (value ? encryption.encrypt(value) : null),
    consume: (value: string | null) => (value ? (encryption.decrypt(value) as string) : null),
  })
  declare email: string

  /**
   * Deterministic SHA-256 of the normalised email. Used for duplicate
   * detection and lookups without exposing plaintext.
   */
  @column({ serializeAs: null })
  declare emailHash: string | null

  @column({ serializeAs: null })
  declare passwordHash: string

  @column({
    prepare: (value: string | null) => (value ? encryption.encrypt(value) : null),
    consume: (value: string | null) => (value ? (encryption.decrypt(value) as string) : null),
  })
  declare birthDate: string | null

  @column()
  declare profileType: 'teacher' | 'student'

  @column()
  declare avatarUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasOne(() => StudentProfile)
  declare studentProfile: HasOne<typeof StudentProfile>

  @hasOne(() => TeacherProfile)
  declare teacherProfile: HasOne<typeof TeacherProfile>

  @hasMany(() => Enrollment, { foreignKey: 'studentId' })
  declare enrollments: HasMany<typeof Enrollment>
}
