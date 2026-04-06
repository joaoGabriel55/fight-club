import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'

export default class AiPrompt extends BaseModel {
  static table = 'ai_prompts'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: string

  @column()
  declare promptText: string

  @column()
  declare responseText: string

  @column()
  declare sourceType: 'feedback' | 'martial_art' | 'class'

  @column({ columnName: 'source_id' })
  declare sourceId: string | null

  @column()
  declare focusArea: string | null

  @column()
  declare martialArt: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
