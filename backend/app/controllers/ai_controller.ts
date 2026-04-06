import type { HttpContext } from '@adonisjs/core/http'
import Feedback from '#models/feedback'
import Enrollment from '#models/enrollment'
import BeltProgress from '#models/belt_progress'
import StudentProfile from '#models/student_profile'
import Class from '#models/class'
import { AuditLogService } from '#services/audit_log_service'
import { AiService } from '#services/ai_service'
import { improvementTipsValidator } from '#validators/ai_validator'
import { classTipsValidator } from '#validators/ai_class_validator'

const SYSTEM_PROMPT = `You are a martial arts training advisor knowledgeable about: Kickboxing, Muay Thai, Brazilian Jiu-Jitsu (BJJ), Boxing, Wrestling (Olympic, Greco-Roman, Folkstyle), Catch Wrestling, Judo, Brazilian Submission Wrestling (Luta Livre), Karate, Capoeira, Taekwondo, Sanda/Sanshou, and Sambo. Provide specific, actionable improvement tips. Do not ask for personal information. Do not reference the student by name.

Respond using Markdown format with clear structure.`

const BELT_MARTIAL_ARTS = new Set([
  'Brazilian Jiu-Jitsu (BJJ)',
  'Judo',
  'Karate',
  'Taekwondo',
  'Capoeira',
])

export default class AiController {
  /**
   * POST /api/v1/ai/improvement-tips
   * Student requests AI-generated improvement tips based on teacher feedback or martial art.
   */
  async improvementTips({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Student only
    if (user.profileType !== 'student') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(improvementTipsValidator)

    let martialArt: string
    let beltName = 'General beginner level'
    let monthsEnrolled = 6
    let feedbackContent = ''

    if (data.feedback_id) {
      // Resolve feedback
      const feedback = await Feedback.query()
        .where('id', data.feedback_id)
        .preload('enrollment', (q) => q.preload('class'))
        .first()

      if (!feedback) {
        return response.status(404).send({ error: { message: 'Feedback not found' } })
      }

      const enrollment = feedback.enrollment

      // Student must own this enrollment
      if (enrollment.studentId !== user.id) {
        return response.status(403).send({ error: { message: 'Forbidden' } })
      }

      // Get belt info
      const latestBelt = await BeltProgress.query()
        .where('enrollment_id', enrollment.id)
        .orderBy('awarded_at', 'desc')
        .first()

      const cls = enrollment.class
      martialArt = cls.martialArt
      beltName = latestBelt ? latestBelt.beltName : 'No belt system for this art'

      // Calculate months enrolled
      const joinedAt = enrollment.joinedAt
      monthsEnrolled = Math.max(1, Math.floor(joinedAt.diffNow('months').months * -1))

      feedbackContent = `Teacher's feedback: "${feedback.content}"`

      await AuditLogService.log(user.id, 'ai_tips_requested', 'feedback', {
        resourceId: feedback.id,
        ipAddress: request.ip(),
        metadata: { focus_area: data.focus_area, class_id: cls.id },
      })
    } else if (data.martial_art) {
      martialArt = data.martial_art

      const hasBeltSystem = BELT_MARTIAL_ARTS.has(martialArt)

      // Try to get enrollment info for belt/tenure if available
      const enrollment = await Enrollment.query()
        .where('student_id', user.id)
        .preload('class')
        .orderBy('joined_at', 'desc')
        .first()

      if (enrollment && enrollment.class.martialArt === martialArt) {
        const latestBelt = await BeltProgress.query()
          .where('enrollment_id', enrollment.id)
          .orderBy('awarded_at', 'desc')
          .first()

        beltName = latestBelt
          ? latestBelt.beltName
          : hasBeltSystem
            ? 'No belt earned yet'
            : 'No belt system for this art'

        const joinedAt = enrollment.joinedAt
        monthsEnrolled = Math.max(1, Math.floor(joinedAt.diffNow('months').months * -1))
      } else if (hasBeltSystem) {
        // Check student profile for belt level
        const profile = await StudentProfile.query().where('user_id', user.id).first()

        const experience = profile?.fightExperience?.find((exp) => exp.martial_art === martialArt)

        beltName = experience?.belt_level ?? 'No belt earned yet'
      } else {
        beltName = 'No belt system for this art'
      }

      await AuditLogService.log(user.id, 'ai_tips_requested', 'ai', {
        resourceId: crypto.randomUUID(),
        ipAddress: request.ip(),
        metadata: { focus_area: data.focus_area, martial_art: martialArt },
      })
    } else {
      return response
        .status(422)
        .send({ error: { message: 'Either feedback_id or martial_art is required' } })
    }

    const focusArea = data.focus_area ?? 'General'

    // Build user prompt — NO PII (no name, email, birth_date)
    const userPrompt = `Martial art: ${martialArt}
Current belt level: ${beltName}
Time training: ${monthsEnrolled} month(s)
${feedbackContent}
Focus area: ${focusArea}

Based on ${feedbackContent ? 'this feedback' : 'your expertise in ' + martialArt}, provide 3-5 specific, actionable improvement tips tailored to this student's level and martial art. Use Markdown format with bold titles and clear structure.`

    const tips = await AiService.generateTips(SYSTEM_PROMPT, userPrompt, {
      userId: user.id,
      sourceType: data.feedback_id ? 'feedback' : 'martial_art',
      sourceId: data.feedback_id,
      focusArea: data.focus_area,
      martialArt: martialArt,
    })
    if (tips === null) {
      return response.status(503).send({ error: { message: 'AI service not configured' } })
    }

    return response.status(200).send({ tips })
  }

  /**
   * POST /api/v1/ai/class-tips
   * Teacher requests AI-generated training suggestions for one of their classes.
   */
  async classTips({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Teacher only
    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(classTipsValidator)

    // Validate teacher owns the class
    const cls = await Class.query()
      .where('id', data.class_id)
      .where('teacher_id', user.id)
      .whereNull('deleted_at')
      .first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Class not found' } })
    }

    // Get all active enrollments for this class
    const enrollments = await Enrollment.query()
      .where('class_id', cls.id)
      .where('status', 'active')
      .select('student_id')

    const totalStudents = enrollments.length

    if (totalStudents === 0) {
      return response.status(422).send({ error: { message: 'Class has no enrolled students' } })
    }

    // Get student profiles to count PRO students (is_competition_mode)
    const studentIds = enrollments.map((e) => e.studentId)
    const profiles = await StudentProfile.query()
      .whereIn('user_id', studentIds)
      .where('is_competition_mode', true)
      .select('user_id')

    const proStudents = profiles.length
    const proPercent = Math.round((proStudents / totalStudents) * 100)

    const focusArea = data.focus_area ?? 'General'

    const userPrompt = `Martial art: ${cls.martialArt}
Total students: ${totalStudents}
PRO students (competition mode): ${proStudents} (${proPercent}%)
Has belt system: ${cls.hasBeltSystem}
Focus area: ${focusArea}

Provide 3-5 specific training exercises or drills suitable for this class composition. Consider the mix of PRO and beginner students. Use Markdown format with bold titles, clear structure, and include estimated duration for each drill.`

    const tips = await AiService.generateTips(SYSTEM_PROMPT, userPrompt, {
      userId: user.id,
      sourceType: 'class',
      sourceId: cls.id,
      focusArea: data.focus_area,
      martialArt: cls.martialArt,
    })
    if (tips === null) {
      return response.status(503).send({ error: { message: 'AI service not configured' } })
    }

    await AuditLogService.log(user.id, 'ai_class_tips_requested', 'ai', {
      resourceId: cls.id,
      ipAddress: request.ip(),
      metadata: { focus_area: data.focus_area, class_id: data.class_id },
    })

    return response.status(200).send({ tips })
  }
}
