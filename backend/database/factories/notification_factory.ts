import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import Notification from '#models/notification'

export const NotificationFactory = factory
  .define(Notification, ({ faker }) => {
    return {
      type: 'student_enrolled',
      title: faker.lorem.sentence(),
      body: faker.lorem.sentence(),
      data: {},
      expiresAt: DateTime.now().plus({ days: 90 }),
    }
  })
  .state('read', (row) => {
    row.readAt = DateTime.now()
  })
  .state('unread', (row) => {
    row.readAt = null
  })
  .build()
