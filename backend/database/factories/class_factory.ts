import factory from '@adonisjs/lucid/factories'
import Class from '#models/class'

export const ClassFactory = factory
  .define(Class, ({ faker }) => {
    return {
      name: faker.company.name() + ' Dojo',
      martialArt: 'BJJ',
      hasBeltSystem: true,
      description: faker.lorem.sentence(),
    }
  })
  .state('withBeltSystem', (row) => {
    row.hasBeltSystem = true
  })
  .state('withoutBeltSystem', (row) => {
    row.hasBeltSystem = false
  })
  .build()
