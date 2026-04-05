import { test } from '@japa/runner'
import { awardBeltValidator } from '#validators/belt_validator'

const validData = {
  belt_name: 'Blue',
  awarded_at: '2025-06-15',
}

test.group('awardBeltValidator', () => {
  test('accepts valid belt data', async ({ assert }) => {
    const result = await awardBeltValidator.validate(validData)
    assert.equal(result.belt_name, 'Blue')
    assert.exists(result.awarded_at)
  })

  test('accepts all standard belt names', async ({ assert }) => {
    const belts = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black']
    for (const belt of belts) {
      const result = await awardBeltValidator.validate({ ...validData, belt_name: belt })
      assert.equal(result.belt_name, belt)
    }
  })

  test('accepts a custom belt name', async ({ assert }) => {
    const result = await awardBeltValidator.validate({
      ...validData,
      belt_name: 'Red',
    })
    assert.equal(result.belt_name, 'Red')
  })

  test('rejects missing belt_name', async ({ assert }) => {
    try {
      await awardBeltValidator.validate({ awarded_at: '2025-06-15' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects empty belt_name', async ({ assert }) => {
    try {
      await awardBeltValidator.validate({ belt_name: '', awarded_at: '2025-06-15' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects belt_name exceeding 100 characters', async ({ assert }) => {
    try {
      await awardBeltValidator.validate({ belt_name: 'a'.repeat(101), awarded_at: '2025-06-15' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects missing awarded_at', async ({ assert }) => {
    try {
      await awardBeltValidator.validate({ belt_name: 'Blue' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects invalid awarded_at date format', async ({ assert }) => {
    try {
      await awardBeltValidator.validate({ belt_name: 'Blue', awarded_at: 'not-a-date' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('accepts ISO date string for awarded_at', async ({ assert }) => {
    const result = await awardBeltValidator.validate({
      belt_name: 'Black',
      awarded_at: '2025-12-31',
    })
    assert.exists(result.awarded_at)
  })
})
