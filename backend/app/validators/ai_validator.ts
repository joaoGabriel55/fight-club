import vine from '@vinejs/vine'

const ALLOWED_FOCUS_AREAS = [
  'Striking technique',
  'Ground game',
  'Takedowns',
  'Defense',
  'Conditioning',
  'Flexibility',
  'Sparring strategy',
  'Competition preparation',
  'Forms / Kata',
  'Footwork',
] as const

const ALLOWED_MARTIAL_ARTS = [
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

export const improvementTipsValidator = vine.compile(
  vine.object({
    feedback_id: vine.string().uuid().optional(),
    martial_art: vine.enum(ALLOWED_MARTIAL_ARTS).optional(),
    focus_area: vine.enum(ALLOWED_FOCUS_AREAS).optional(),
  })
)
