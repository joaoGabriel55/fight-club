import emitter from '@adonisjs/core/services/emitter'
import StudentEnrolled from '#events/student_enrolled'

const CreateNotification = () => import('#listeners/create_notification')

emitter.on(StudentEnrolled, [CreateNotification, 'handle'])
