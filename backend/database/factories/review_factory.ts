import factory from '@adonisjs/lucid/factories'
import Review from '#models/review'
import { DateTime } from 'luxon'

export const ReviewFactory = factory
  .define(Review, ({ faker }) => {
    return {
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      sessionDate: DateTime.now(),
    }
  })
  .build()
