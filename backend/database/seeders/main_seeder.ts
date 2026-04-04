import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { createHash, randomUUID } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { DateTime } from 'luxon'
import User from '#models/user'
import StudentProfile from '#models/student_profile'
import TeacherProfile from '#models/teacher_profile'
import Class from '#models/class'
import ClassSchedule from '#models/class_schedule'
import Invitation from '#models/invitation'
import Enrollment from '#models/enrollment'
import Announcement from '#models/announcement'
import Feedback from '#models/feedback'
import BeltProgress from '#models/belt_progress'
import Notification from '#models/notification'

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

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
]

const BELT_NAMES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black']

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] // Sun–Sat

const DEFAULT_PASSWORD = 'Demo1234!'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // Skip if already seeded (idempotent — safe to run on every container start)
    const existing = await User.findBy('emailHash', hashEmail('teacher@demo.com'))
    if (existing) {
      console.log('🌱 Seed skipped — data already exists')
      return
    }

    // ── 1. Teachers ──────────────────────────────────────────────────────
    const teachers: User[] = []

    // Fixed teacher for easy login during development
    const fixedTeacher = await User.create({
      firstName: 'Sensei',
      lastName: 'Demo',
      email: 'teacher@demo.com',
      emailHash: hashEmail('teacher@demo.com'),
      passwordHash: DEFAULT_PASSWORD,
      birthDate: '1985-03-15',
      profileType: 'teacher',
    })
    await TeacherProfile.create({
      userId: fixedTeacher.id,
      fightExperience: [
        {
          martial_art: 'Brazilian Jiu-Jitsu (BJJ)',
          experience_years: 15,
          belt_level: 'Black',
          competition_level: 'professional',
        },
      ],
    })
    teachers.push(fixedTeacher)

    for (let i = 0; i < 3; i++) {
      const email = faker.internet.email().toLowerCase()
      const teacher = await User.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email,
        emailHash: hashEmail(email),
        passwordHash: DEFAULT_PASSWORD,
        birthDate: faker.date
          .birthdate({ min: 25, max: 55, mode: 'age' })
          .toISOString()
          .split('T')[0],
        profileType: 'teacher',
      })
      const BELT_ARTS = new Set([
        'Brazilian Jiu-Jitsu (BJJ)',
        'Judo',
        'Karate',
        'Taekwondo',
        'Capoeira',
      ])
      const BELTS = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black']
      await TeacherProfile.create({
        userId: teacher.id,
        fightExperience: faker.helpers
          .arrayElements(MARTIAL_ARTS, { min: 1, max: 3 })
          .map((art) => ({
            martial_art: art,
            experience_years: faker.number.int({ min: 1, max: 20 }),
            belt_level: BELT_ARTS.has(art) ? faker.helpers.arrayElement(BELTS) : null,
            competition_level: faker.helpers.arrayElement(['amateur', 'professional', null]),
          })),
      })
      teachers.push(teacher)
    }

    // ── 2. Students ──────────────────────────────────────────────────────
    const students: User[] = []

    // Fixed student for easy login during development
    const fixedStudent = await User.create({
      firstName: 'Student',
      lastName: 'Demo',
      email: 'student@demo.com',
      emailHash: hashEmail('student@demo.com'),
      passwordHash: DEFAULT_PASSWORD,
      birthDate: '2000-06-20',
      profileType: 'student',
    })
    await StudentProfile.create({
      userId: fixedStudent.id,
      weightKg: '75.0',
      heightCm: '178.0',
      dataConsentAt: DateTime.now(),
    })
    students.push(fixedStudent)

    for (let i = 0; i < 12; i++) {
      const email = faker.internet.email().toLowerCase()
      const student = await User.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email,
        emailHash: hashEmail(email),
        passwordHash: DEFAULT_PASSWORD,
        birthDate: faker.date
          .birthdate({ min: 16, max: 40, mode: 'age' })
          .toISOString()
          .split('T')[0],
        profileType: 'student',
      })
      await StudentProfile.create({
        userId: student.id,
        weightKg: String(faker.number.float({ min: 50, max: 120, fractionDigits: 1 })),
        heightCm: String(faker.number.float({ min: 150, max: 200, fractionDigits: 1 })),
        dataConsentAt: DateTime.now(),
      })
      students.push(student)
    }

    // ── 3. Classes ───────────────────────────────────────────────────────
    const classes: Class[] = []

    for (const teacher of teachers) {
      const numClasses = faker.number.int({ min: 1, max: 3 })
      for (let i = 0; i < numClasses; i++) {
        const martialArt = faker.helpers.arrayElement(MARTIAL_ARTS)
        const hasBeltSystem = ['Brazilian Jiu-Jitsu', 'Karate', 'Judo', 'Taekwondo'].includes(
          martialArt
        )

        const cls = await Class.create({
          teacherId: teacher.id,
          name: `${martialArt} ${faker.helpers.arrayElement(['Fundamentals', 'Advanced', 'Competition Prep', 'Beginners', 'All Levels'])}`,
          martialArt,
          hasBeltSystem,
          description: faker.lorem.paragraph(),
        })
        classes.push(cls)
      }
    }

    // ── 4. Class Schedules ───────────────────────────────────────────────
    for (const cls of classes) {
      const numSchedules = faker.number.int({ min: 2, max: 4 })
      const days = faker.helpers.arrayElements(DAYS_OF_WEEK, numSchedules)

      for (const day of days) {
        const startHour = faker.number.int({ min: 6, max: 20 })
        const startMin = faker.helpers.arrayElement([0, 30])
        const durationMin = faker.helpers.arrayElement([60, 90])
        const endHour = startHour + Math.floor((startMin + durationMin) / 60)
        const endMin = (startMin + durationMin) % 60

        await ClassSchedule.create({
          classId: cls.id,
          dayOfWeek: day,
          startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`,
        })
      }
    }

    // ── 5. Invitations (one active per class) ────────────────────────────
    for (const cls of classes) {
      await Invitation.create({
        classId: cls.id,
        token: randomUUID(),
        expiresAt: DateTime.now().plus({ days: 30 }),
        isActive: true,
        maxUses: faker.helpers.arrayElement([null, 10, 20, 50]),
        useCount: 0,
      })
    }

    // ── 6. Enrollments ───────────────────────────────────────────────────
    const enrollments: Enrollment[] = []

    // Ensure fixed student is enrolled in at least 2 classes (one from fixed teacher)
    const fixedTeacherClasses = classes.filter((c) => c.teacherId === fixedTeacher.id)
    if (fixedTeacherClasses.length > 0) {
      const enrollment = await Enrollment.create({
        classId: fixedTeacherClasses[0].id,
        studentId: fixedStudent.id,
        status: 'active',
        joinedAt: DateTime.now().minus({ days: faker.number.int({ min: 7, max: 60 }) }),
        dataConsentAt: DateTime.now().minus({ days: faker.number.int({ min: 7, max: 60 }) }),
      })
      enrollments.push(enrollment)
    }

    // Enroll each student in 1–3 random classes
    for (const student of students) {
      const numEnrollments = faker.number.int({ min: 1, max: 3 })
      const selectedClasses = faker.helpers.arrayElements(classes, numEnrollments)

      for (const cls of selectedClasses) {
        // Skip if already enrolled (e.g., fixed student above)
        const exists = enrollments.find((e) => e.classId === cls.id && e.studentId === student.id)
        if (exists) continue

        const enrollment = await Enrollment.create({
          classId: cls.id,
          studentId: student.id,
          status: 'active',
          joinedAt: DateTime.now().minus({ days: faker.number.int({ min: 1, max: 90 }) }),
          dataConsentAt: DateTime.now().minus({ days: faker.number.int({ min: 1, max: 90 }) }),
        })
        enrollments.push(enrollment)
      }
    }

    // ── 7. Announcements ─────────────────────────────────────────────────
    for (const cls of classes) {
      const numAnnouncements = faker.number.int({ min: 1, max: 4 })
      for (let i = 0; i < numAnnouncements; i++) {
        await Announcement.create({
          classId: cls.id,
          authorId: cls.teacherId,
          title: faker.helpers.arrayElement([
            'Schedule Change This Week',
            'No Class on Friday',
            'Tournament Registration Open',
            'New Training Equipment',
            'Belt Testing Next Month',
            'Holiday Schedule',
            'Welcome New Students!',
            'Reminder: Bring Your Gi',
          ]),
          content: faker.lorem.paragraph(),
        })
      }
    }

    // ── 8. Feedback ──────────────────────────────────────────────────────
    for (const enrollment of enrollments) {
      if (faker.datatype.boolean(0.6)) {
        const cls = classes.find((c) => c.id === enrollment.classId)!
        const numFeedback = faker.number.int({ min: 1, max: 3 })
        for (let i = 0; i < numFeedback; i++) {
          await Feedback.create({
            enrollmentId: enrollment.id,
            teacherId: cls.teacherId,
            content: faker.helpers.arrayElement([
              'Great progress this week! Your guard passing has improved significantly.',
              'Work on keeping your hands up during sparring. Good energy though.',
              'Excellent technique on the throws today. Keep drilling the entry.',
              "Need to focus more on hip movement. Let's work on this next session.",
              'Outstanding performance in the last sparring round. Very composed.',
              'Your conditioning is improving. Keep up the extra cardio work.',
              'Good job helping the newer students. That shows real maturity.',
            ]),
          })
        }
      }
    }

    // ── 9. Belt Progress ─────────────────────────────────────────────────
    for (const enrollment of enrollments) {
      const cls = classes.find((c) => c.id === enrollment.classId)!
      if (!cls.hasBeltSystem) continue

      if (faker.datatype.boolean(0.5)) {
        const numBelts = faker.number.int({ min: 1, max: 3 })
        for (let i = 0; i < numBelts; i++) {
          await BeltProgress.create({
            enrollmentId: enrollment.id,
            beltName: BELT_NAMES[i],
            awardedAt: DateTime.now().minus({ days: faker.number.int({ min: 1, max: 180 }) }),
            awardedBy: cls.teacherId,
          })
        }
      }
    }

    // ── 10. Notifications ────────────────────────────────────────────────
    // Create some notifications for the fixed student
    const studentNotifs = [
      {
        type: 'student_enrolled',
        title: 'Enrollment confirmed',
        body: `You've joined ${fixedTeacherClasses[0]?.name ?? 'a class'}`,
      },
      {
        type: 'announcement',
        title: 'New announcement',
        body: 'Your teacher posted an update',
      },
      {
        type: 'feedback_received',
        title: 'New feedback',
        body: 'Your teacher sent you feedback',
      },
    ]

    for (const notif of studentNotifs) {
      await Notification.create({
        userId: fixedStudent.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        data: {},
        expiresAt: DateTime.now().plus({ days: 90 }),
      })
    }

    // Create some notifications for the fixed teacher
    const teacherNotifs = enrollments
      .filter((e) => fixedTeacherClasses.some((c) => c.id === e.classId))
      .slice(0, 5)

    for (const enrollment of teacherNotifs) {
      const student = students.find((s) => s.id === enrollment.studentId)
      if (!student) continue
      await Notification.create({
        userId: fixedTeacher.id,
        type: 'student_enrolled',
        title: 'New student enrolled',
        body: `${student.firstName} joined your class`,
        data: { enrollmentId: enrollment.id, classId: enrollment.classId },
        expiresAt: DateTime.now().plus({ days: 90 }),
      })
    }

    console.log('🌱 Seed completed!')
    console.log(`   Teachers: ${teachers.length} (login: teacher@demo.com / ${DEFAULT_PASSWORD})`)
    console.log(`   Students: ${students.length} (login: student@demo.com / ${DEFAULT_PASSWORD})`)
    console.log(`   Classes: ${classes.length}`)
    console.log(`   Enrollments: ${enrollments.length}`)
  }
}
