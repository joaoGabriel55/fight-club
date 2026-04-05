import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { AuditLogService } from '#services/audit_log_service'
import { UserFactory } from '#database/factories/index'
import AuditLog from '#models/audit_log'

test.group('AuditLogService', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('creates audit log with correct action and resourceType', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'login', 'auth')

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.equal(log.action, 'login')
    assert.equal(log.resourceType, 'auth')
  })

  test('stores resourceId when provided', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'class_created', 'class', {
      resourceId: user.id,
    })

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.equal(log.resourceId, user.id)
  })

  test('stores ipAddress when provided', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'login', 'auth', {
      ipAddress: '192.168.1.1',
    })

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.equal(log.ipAddress, '192.168.1.1')
  })

  test('stores metadata as JSON', async ({ assert }) => {
    const user = await UserFactory.create()
    const metadata = {
      browser: 'Chrome',
      os: 'Windows',
      extra: { nested: true },
    }

    await AuditLogService.log(user.id, 'profile_update', 'user', {
      metadata,
    })

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.deepEqual(log.metadata, metadata)
  })

  test('records userId correctly', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'logout', 'auth')

    const log = await AuditLog.query().where('action', 'logout').firstOrFail()
    assert.equal(log.userId, user.id)
  })

  test('works with null userId (for anonymized records)', async ({ assert }) => {
    await AuditLogService.log(null, 'account_erasure_requested', 'user', {
      metadata: { reason: 'user request' },
    })

    const log = await AuditLog.query().where('action', 'account_erasure_requested').firstOrFail()
    assert.isNull(log.userId)
    assert.equal(log.resourceType, 'user')
  })

  test('defaults resourceId to null when not provided', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'login', 'auth')

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.isNull(log.resourceId)
  })

  test('defaults ipAddress to null when not provided', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'login', 'auth')

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.isNull(log.ipAddress)
  })

  test('defaults metadata to null when not provided', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'login', 'auth')

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.isNull(log.metadata)
  })

  test('sets createdAt automatically', async ({ assert }) => {
    const user = await UserFactory.create()

    await AuditLogService.log(user.id, 'login', 'auth')

    const log = await AuditLog.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(log.createdAt)
  })
})
