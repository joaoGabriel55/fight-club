import factory from '@adonisjs/lucid/factories'
import Announcement from '#models/announcement'

export const AnnouncementFactory = factory
  .define(Announcement, ({ faker }) => {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    }
  })
  .build()
