import { createHash } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import User from '#models/user'
import StudentProfile from '#models/student_profile'
import TeacherProfile from '#models/teacher_profile'
import { AuditLogService } from '#services/audit_log_service'
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} from '#validators/auth_validator'
import env from '#start/env'

/**
 * Compute a deterministic SHA-256 hash of a normalised email.
 * Used for duplicate-detection and login lookups against the encrypted email column.
 */
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export default class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const emailHash = hashEmail(data.email)

    // Duplicate check: use the deterministic hash column for a reliable lookup.
    const existing = await User.query()
      .where('email_hash', emailHash)
      .whereNull('deleted_at')
      .first()

    if (existing) {
      // Generic message to prevent email enumeration
      return response.status(422).send({
        error: {
          message: 'Validation failed',
          fields: [{ field: 'email', message: 'Invalid credentials' }],
        },
      })
    }

    const passwordHash = await hash.make(data.password)

    const user = await User.create({
      firstName: data.first_name,
      lastName: data.last_name ?? null,
      email: data.email,
      emailHash,
      passwordHash,
      profileType: data.profile_type,
    })

    if (data.profile_type === 'student') {
      await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })
    } else {
      await TeacherProfile.create({ userId: user.id })
    }

    const expiresIn = env.get('TOKEN_EXPIRY', '7 days')
    const token = await User.accessTokens.create(user, ['*'], { expiresIn })

    return response.status(201).send({
      token: token.value!.release(),
      user: {
        id: user.id,
        first_name: user.firstName,
        profile_type: user.profileType,
      },
    })
  }

  /**
   * POST /api/v1/auth/login
   *
   * AuthFinder.verifyCredentials uses the `uids` option (email) to look up
   * the user. Since our email column is encrypted we override the lookup to
   * use email_hash, then delegate password verification to `hash.verify`.
   */
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    const emailHash = hashEmail(data.email)

    const user = await User.query().where('email_hash', emailHash).whereNull('deleted_at').first()

    // Check credentials without leaking timing information
    const passwordOk = user ? await hash.verify(user.passwordHash, data.password) : false

    if (!user || !passwordOk) {
      return response.status(401).send({ error: { message: 'Invalid credentials' } })
    }

    const expiresIn = env.get('TOKEN_EXPIRY', '7 days')
    const token = await User.accessTokens.create(user, ['*'], { expiresIn })

    await AuditLogService.log(user.id, 'login', 'user', {
      ipAddress: request.ip(),
    })

    return response.status(200).send({
      token: token.value!.release(),
      user: {
        id: user.id,
        first_name: user.firstName,
        profile_type: user.profileType,
      },
    })
  }

  /**
   * DELETE /api/v1/auth/logout
   */
  async logout({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const currentToken = auth.user!.currentAccessToken

    await User.accessTokens.delete(user, currentToken.identifier)

    await AuditLogService.log(user.id, 'logout', 'user', {
      ipAddress: request.ip(),
    })

    return response.status(204).send(null)
  }

  /**
   * GET /api/v1/auth/me
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('studentProfile')
    await user.load('teacherProfile')

    return response.status(200).send({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      birth_date: user.birthDate,
      profile_type: user.profileType,
      avatar_url: user.avatarUrl,
      student_profile: user.studentProfile
        ? {
            weight_kg: user.studentProfile.weightKg,
            height_cm: user.studentProfile.heightCm,
          }
        : null,
      teacher_profile: user.teacherProfile
        ? {
            fight_experience: user.teacherProfile.fightExperience,
          }
        : null,
    })
  }

  /**
   * PUT /api/v1/auth/me
   */
  async updateMe({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(updateProfileValidator)

    if (data.first_name !== undefined) user.firstName = data.first_name
    if (data.last_name !== undefined) user.lastName = data.last_name
    if (data.avatar_url !== undefined) user.avatarUrl = data.avatar_url
    if (data.birth_date !== undefined) user.birthDate = data.birth_date

    await user.save()

    if (
      user.profileType === 'student' &&
      (data.weight_kg !== undefined || data.height_cm !== undefined)
    ) {
      let profile = await StudentProfile.findBy('user_id', user.id)
      if (!profile) {
        profile = await StudentProfile.create({ userId: user.id })
      }
      if (data.weight_kg !== undefined) profile.weightKg = data.weight_kg
      if (data.height_cm !== undefined) profile.heightCm = data.height_cm
      await profile.save()
    }

    await AuditLogService.log(user.id, 'profile_update', 'user', {
      ipAddress: request.ip(),
    })

    return response.status(200).send({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      birth_date: user.birthDate,
      profile_type: user.profileType,
      avatar_url: user.avatarUrl,
    })
  }

  /**
   * DELETE /api/v1/auth/me
   * Anonymises the account in place; does not hard-delete the users row.
   */
  async deleteMe({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await AuditLogService.log(user.id, 'account_delete', 'user', {
      ipAddress: request.ip(),
    })

    // Revoke current token before anonymising
    const currentToken = auth.user!.currentAccessToken
    await User.accessTokens.delete(user, currentToken.identifier)

    // Anonymise: replace email with a SHA-256 hash so it can never be
    // reverse-looked-up, and clear the lookup hash.
    const emailHash = createHash('sha256').update(user.email).digest('hex')

    user.firstName = 'Deleted'
    user.lastName = 'User'
    user.email = `deleted:${emailHash}`
    user.emailHash = null
    user.passwordHash = ''
    user.deletedAt = DateTime.now()
    await user.save()

    // Remove profile rows
    await StudentProfile.query().where('user_id', user.id).delete()
    await TeacherProfile.query().where('user_id', user.id).delete()

    return response.status(204).send(null)
  }
}
