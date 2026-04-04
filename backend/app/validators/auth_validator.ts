import vine from '@vinejs/vine'

const MARTIAL_ARTS = [
  'Kickboxing',
  'Muay Thai',
  'Brazilian Jiu-Jitsu (BJJ)',
  'Boxing',
  'Wrestling',
  'Catch Wrestling',
  'Judo',
  'Luta Livre',
  'Karate',
  'Capoeira',
  'Taekwondo',
  'Sanda/Sanshou',
  'Sambo',
] as const

const BELT_LEVELS = [
  'White',
  'Yellow',
  'Orange',
  'Green',
  'Blue',
  'Purple',
  'Brown',
  'Black',
] as const

const COMPETITION_LEVELS = ['amateur', 'professional'] as const

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
    first_name: vine.string().trim().minLength(1).maxLength(100),
    last_name: vine.string().trim().minLength(1).maxLength(100).optional(),
    profile_type: vine.enum(['teacher', 'student'] as const),
    birth_date: vine.string().trim().minLength(1),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    first_name: vine.string().trim().minLength(1).maxLength(100).optional(),
    last_name: vine.string().trim().minLength(1).maxLength(100).optional(),
    avatar_url: vine.string().optional().nullable(),
    birth_date: vine.string().optional().nullable(),
    // Student-only fields — ignored silently for teachers
    weight_kg: vine.string().optional().nullable(),
    height_cm: vine.string().optional().nullable(),
    // Both teacher and student
    fight_experience: vine
      .array(
        vine.object({
          martial_art: vine.enum(MARTIAL_ARTS),
          experience_years: vine.number().min(0).max(50),
          belt_level: vine.enum(BELT_LEVELS).optional().nullable(),
          competition_level: vine.enum(COMPETITION_LEVELS).optional().nullable(),
        })
      )
      .optional()
      .nullable(),
  })
)
