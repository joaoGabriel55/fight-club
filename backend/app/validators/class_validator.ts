import vine from '@vinejs/vine'

const scheduleSchema = vine.object({
  day_of_week: vine.number().withoutDecimals().min(0).max(6),
  start_time: vine.string().trim(),
  end_time: vine.string().trim(),
})

export const createClassValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    martial_art: vine.string().trim().minLength(1),
    has_belt_system: vine.boolean(),
    description: vine.string().trim().optional().nullable(),
    schedules: vine.array(scheduleSchema).minLength(1),
  })
)

export const updateClassValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).optional(),
    martial_art: vine.string().trim().minLength(1).optional(),
    has_belt_system: vine.boolean().optional(),
    description: vine.string().trim().optional().nullable(),
  })
)

export const createScheduleValidator = vine.compile(
  vine.object({
    day_of_week: vine.number().withoutDecimals().min(0).max(6),
    start_time: vine.string().trim(),
    end_time: vine.string().trim(),
  })
)

export const updateScheduleValidator = vine.compile(
  vine.object({
    day_of_week: vine.number().withoutDecimals().min(0).max(6).optional(),
    start_time: vine.string().trim().optional(),
    end_time: vine.string().trim().optional(),
  })
)
