import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Class from '#models/class'
import Review from '#models/review'
import ReviewPolicy from '#policies/review_policy'
import { AuditLogService } from '#services/audit_log_service'
import { createReviewValidator, updateReviewValidator } from '#validators/review_validator'
import { DateTime } from 'luxon'

export default class ReviewsController {
  /**
   * POST /api/v1/classes/:classId/reviews
   * Create a review for a class session (student only, must be enrolled).
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!(await ReviewPolicy.create(user, cls))) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(createReviewValidator)

    const sessionDate = DateTime.fromISO(data.session_date)
    const sessionDateValue = sessionDate.toISODate()
    if (!sessionDateValue) {
      return response.status(400).send({ error: { message: 'Invalid session date' } })
    }

    const existingReview = await Review.query()
      .where('class_id', cls.id)
      .where('student_id', user.id)
      .where('session_date', sessionDateValue)
      .first()

    if (existingReview) {
      return response
        .status(409)
        .send({ error: { message: 'Review already exists for this session' } })
    }

    const review = await Review.create({
      classId: cls.id,
      studentId: user.id,
      rating: data.rating,
      comment: data.comment ?? null,
      sessionDate: DateTime.fromISO(data.session_date),
    })

    await AuditLogService.log(user.id, 'review_created', 'review', {
      resourceId: review.id,
      ipAddress: request.ip(),
      metadata: { class_id: cls.id, session_date: data.session_date },
    })

    return response.status(201).send({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      session_date: review.sessionDate.toISODate(),
      created_at: review.createdAt,
    })
  }

  /**
   * PUT /api/v1/classes/:classId/reviews/:id
   * Update own review (student only).
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    const review = await Review.query().where('id', params.id).where('class_id', cls.id).first()

    if (!review) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!ReviewPolicy.update(user, review)) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(updateReviewValidator)

    review.rating = data.rating
    review.comment = data.comment ?? null
    await review.save()

    await AuditLogService.log(user.id, 'review_updated', 'review', {
      resourceId: review.id,
      ipAddress: request.ip(),
    })

    return response.status(200).send({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      session_date: review.sessionDate.toISODate(),
      updated_at: review.updatedAt,
    })
  }

  /**
   * GET /api/v1/classes/:classId/reviews
   * List anonymous reviews for a class (teacher only).
   */
  async index({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!ReviewPolicy.listForTeacher(user, cls)) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const sessionDate = request.input('session_date')

    let query = Review.query().where('class_id', cls.id).orderBy('created_at', 'desc')

    if (sessionDate) {
      query = query.where('session_date', sessionDate)
    }

    const reviews = await query.preload('student')

    return response.status(200).send(
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        session_date: r.sessionDate.toISODate(),
        created_at: r.createdAt,
      }))
    )
  }

  /**
   * GET /api/v1/classes/:classId/reviews/summary
   * Get average rating and count (teacher only).
   */
  async summary({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!ReviewPolicy.listForTeacher(user, cls)) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const sessionDate = request.input('session_date')

    let query = db
      .from('reviews')
      .where('class_id', cls.id)
      .select(db.raw('AVG(rating) as average'), db.raw('COUNT(*) as count'))

    if (sessionDate) {
      query = query.where('session_date', sessionDate)
    }

    const result = await query.first()

    return response.status(200).send({
      average: result?.average ? Number.parseFloat(result.average).toFixed(1) : null,
      count: Number(result?.count) || 0,
    })
  }

  /**
   * GET /api/v1/my-reviews/:classId
   * Get all own reviews for a class (student only).
   */
  async myReviews({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'student') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    const reviews = await Review.query()
      .where('class_id', cls.id)
      .where('student_id', user.id)
      .orderBy('session_date', 'desc')

    return response.status(200).send(
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        session_date: r.sessionDate.toISODate(),
        created_at: r.createdAt,
      }))
    )
  }
}
