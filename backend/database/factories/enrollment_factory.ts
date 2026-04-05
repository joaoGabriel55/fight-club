import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import Enrollment from '#models/enrollment'

export const EnrollmentFactory = factory
  .define(Enrollment, () => {
    return {
      status: 'active' as const,
      joinedAt: DateTime.now(),
      leftAt: null,
      dataConsentAt: DateTime.now(),
    }
  })
  .build()
