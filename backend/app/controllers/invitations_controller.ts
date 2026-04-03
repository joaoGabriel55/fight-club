import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import env from '#start/env'
import Class from '#models/class'
import Invitation from '#models/invitation'
import { AuditLogService } from '#services/audit_log_service'
import { createInvitationValidator } from '#validators/invitation_validator'

export default class InvitationsController {
  /**
   * POST /api/v1/classes/:classId/invitations
   * Generate a new invite link for the class (teacher-only).
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    // Only one active invitation allowed per class
    const existingInvitation = await Invitation.query()
      .where('class_id', cls.id)
      .where('is_active', true)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (existingInvitation) {
      return response.status(409).send({
        error: { message: 'This class already has an active invitation link' },
      })
    }

    const data = await request.validateUsing(createInvitationValidator)

    const expiresAt = DateTime.fromISO(data.expires_at)
    if (!expiresAt.isValid || expiresAt <= DateTime.now()) {
      return response.status(422).send({
        error: {
          message: 'Validation failed',
          fields: [{ field: 'expires_at', message: 'expires_at must be a future date' }],
        },
      })
    }

    const invitation = await Invitation.create({
      classId: cls.id,
      expiresAt,
      isActive: true,
      maxUses: data.max_uses ?? null,
      useCount: 0,
    })

    // Reload to pick up DB-generated token (gen_random_uuid() default)
    await invitation.refresh()

    await AuditLogService.log(user.id, 'invitation_created', 'invitation', {
      resourceId: invitation.id,
      ipAddress: request.ip(),
      metadata: { class_id: cls.id },
    })

    const appUrl = env.get('VITE_APP_URL')

    return response.status(201).send({
      id: invitation.id,
      token: invitation.token,
      invite_url: `${appUrl}/join/${invitation.token}`,
      expires_at: invitation.expiresAt,
      max_uses: invitation.maxUses,
    })
  }

  /**
   * GET /api/v1/classes/:classId/invitations
   * List active (non-expired, is_active) invitations for the class.
   */
  async index({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const invitations = await Invitation.query()
      .where('class_id', cls.id)
      .where('is_active', true)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .orderBy('created_at', 'desc')

    const appUrl = env.get('VITE_APP_URL')

    return response.status(200).send(
      invitations.map((inv) => ({
        id: inv.id,
        token: inv.token,
        invite_url: `${appUrl}/join/${inv.token}`,
        expires_at: inv.expiresAt,
        max_uses: inv.maxUses,
        use_count: inv.useCount,
      }))
    )
  }

  /**
   * DELETE /api/v1/invitations/:id
   * Revoke an invitation (set is_active = false).
   */
  async destroy({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const invitation = await Invitation.query().where('id', params.id).preload('class').first()

    if (!invitation) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (invitation.class.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    invitation.isActive = false
    await invitation.save()

    await AuditLogService.log(user.id, 'invitation_revoked', 'invitation', {
      resourceId: invitation.id,
      ipAddress: request.ip(),
      metadata: { class_id: invitation.classId },
    })

    return response.status(204).send(null)
  }
}
