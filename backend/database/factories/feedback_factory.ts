import factory from '@adonisjs/lucid/factories'
import Feedback from '#models/feedback'

export const FeedbackFactory = factory
  .define(Feedback, ({ faker }) => {
    return {
      content: faker.lorem.paragraph(),
    }
  })
  .build()
