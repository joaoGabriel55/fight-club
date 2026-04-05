import factory from '@adonisjs/lucid/factories'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import Invitation from '#models/invitation'

export const InvitationFactory = factory
  .define(Invitation, () => {
    return {
      token: randomUUID(),
      expiresAt: DateTime.now().plus({ days: 7 }),
      isActive: true,
      maxUses: null,
      useCount: 0,
    }
  })
  .state('expired', (row) => {
    row.expiresAt = DateTime.now().minus({ days: 1 })
  })
  .state('active', (row) => {
    row.expiresAt = DateTime.now().plus({ days: 7 })
    row.isActive = true
  })
  .build()
