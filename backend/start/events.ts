import emitter from '@adonisjs/core/services/emitter'
import StudentEnrolled from '#events/student_enrolled'
import AnnouncementCreated from '#events/announcement_created'
import FeedbackSent from '#events/feedback_sent'
import BeltAwarded from '#events/belt_awarded'

const CreateNotification = () => import('#listeners/create_notification')

emitter.on(StudentEnrolled, [CreateNotification, 'handle'])
emitter.on(AnnouncementCreated, [CreateNotification, 'handleAnnouncementCreated'])
emitter.on(FeedbackSent, [CreateNotification, 'handleFeedbackSent'])
emitter.on(BeltAwarded, [CreateNotification, 'handleBeltAwarded'])
