import factory from '@adonisjs/lucid/factories'
import { createHash, randomUUID } from 'node:crypto'
import User from '#models/user'

export const UserFactory = factory
  .define(User, ({ faker }) => {
    const email = faker.internet.email().toLowerCase()
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email,
      emailHash: createHash('sha256').update(email).digest('hex'),
      passwordHash: 'password123',
      birthDate: '2000-01-01',
      profileType: 'student' as const,
      avatarUrl: null,
    }
  })
  .state('teacher', (row) => {
    row.profileType = 'teacher'
  })
  .state('student', (row) => {
    row.profileType = 'student'
  })
  .state('deleted', (row) => {
    const hash = randomUUID()
    row.firstName = 'Deleted'
    row.lastName = 'User'
    row.email = `deleted:${hash}`
    row.emailHash = null
  })
  .build()
