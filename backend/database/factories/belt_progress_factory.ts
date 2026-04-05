import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import BeltProgress from '#models/belt_progress'

const BELT_NAMES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black']

export const BeltProgressFactory = factory
  .define(BeltProgress, ({ faker }) => {
    return {
      beltName: faker.helpers.arrayElement(BELT_NAMES),
      awardedAt: DateTime.now(),
    }
  })
  .build()
