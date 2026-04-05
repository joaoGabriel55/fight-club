import factory from '@adonisjs/lucid/factories'
import ClassSchedule from '#models/class_schedule'

export const ClassScheduleFactory = factory
  .define(ClassSchedule, () => {
    return {
      dayOfWeek: 1,
      startTime: '09:00:00',
      endTime: '10:00:00',
    }
  })
  .build()
