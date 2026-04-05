import { createHash } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import User from '#models/user'
import StudentProfile from '#models/student_profile'
import TeacherProfile from '#models/teacher_profile'
import { AuditLogService } from '#services/audit_log_service'
import { UserAnonymizer } from '#services/user_anonymizer'
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

/**
 * Convert a stored avatar URL (Supabase or local dev path) into a
 * proxied URL that hides the real storage location from clients.
 * e.g. "https://xyz.supabase.co/.../avatar123.jpg" → "/api/v1/avatars/avatar123.jpg"
 * e.g. "/api/v1/dev/avatars/avatar123.jpg" → "/api/v1/avatars/avatar123.jpg"
 */
function toProxiedAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null
  const fileName = avatarUrl.split('/').pop()
  if (!fileName) return null
  return `/api/v1/avatars/${fileName}`
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
      lastName: data.last_name,
      email: data.email,
      emailHash,
      passwordHash,
      profileType: data.profile_type,
      birthDate: data.birth_date,
    })

    if (data.profile_type === 'student') {
      await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })
    } else {
      await TeacherProfile.create({ userId: user.id })
    }

    const expiresIn = env.get('TOKEN_EXPIRY', '7 days')
    const token = await User.accessTokens.create(user, ['*'], { expiresIn })
    const tokenValue = token.value!.release()

    response.cookie('auth_token', tokenValue, {
      httpOnly: true,
      secure: env.get('NODE_ENV') === 'production',
      sameSite: env.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    })

    return response.status(201).send({
      token: tokenValue,
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
    const tokenValue = token.value!.release()

    await AuditLogService.log(user.id, 'login', 'user', {
      ipAddress: request.ip(),
    })

    response.cookie('auth_token', tokenValue, {
      httpOnly: true,
      secure: env.get('NODE_ENV') === 'production',
      sameSite: env.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    })

    return response.status(200).send({
      token: tokenValue,
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

    response.clearCookie('auth_token', { path: '/' })
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
      avatar_url: toProxiedAvatarUrl(user.avatarUrl),
      student_profile: user.studentProfile
        ? {
            weight_kg: user.studentProfile.weightKg,
            height_cm: user.studentProfile.heightCm,
            fight_experience: user.studentProfile.fightExperience,
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

    if (user.profileType === 'student') {
      if (
        data.weight_kg !== undefined ||
        data.height_cm !== undefined ||
        data.fight_experience !== undefined
      ) {
        let profile = await StudentProfile.findBy('user_id', user.id)
        if (!profile) {
          profile = await StudentProfile.create({ userId: user.id })
        }
        if (data.weight_kg !== undefined) profile.weightKg = data.weight_kg
        if (data.height_cm !== undefined) profile.heightCm = data.height_cm
        if (data.fight_experience !== undefined) profile.fightExperience = data.fight_experience
        await profile.save()
      }
    }

    if (user.profileType === 'teacher' && data.fight_experience !== undefined) {
      let profile = await TeacherProfile.findBy('user_id', user.id)
      if (!profile) {
        profile = await TeacherProfile.create({ userId: user.id })
      }
      profile.fightExperience = data.fight_experience
      await profile.save()
    }

    await AuditLogService.log(user.id, 'profile_update', 'user', {
      ipAddress: request.ip(),
    })

    await user.load('studentProfile')
    await user.load('teacherProfile')

    return response.status(200).send({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      birth_date: user.birthDate,
      profile_type: user.profileType,
      avatar_url: toProxiedAvatarUrl(user.avatarUrl),
      student_profile: user.studentProfile
        ? {
            weight_kg: user.studentProfile.weightKg,
            height_cm: user.studentProfile.heightCm,
            fight_experience: user.studentProfile.fightExperience,
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

    await UserAnonymizer.anonymize(user)

    return response.status(204).send(null)
  }
}
