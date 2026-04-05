import { test } from '@japa/runner'
import { registerValidator } from '#validators/auth_validator'

const validData = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  profile_type: 'student' as const,
  birth_date: '2000-01-15',
}

test.group('registerValidator', () => {
  test('accepts valid registration data', async ({ assert }) => {
    const result = await registerValidator.validate(validData)
    assert.equal(result.email, 'test@example.com')
    assert.equal(result.first_name, 'John')
    assert.equal(result.profile_type, 'student')
  })

  test('accepts valid data with teacher profile_type', async ({ assert }) => {
    const result = await registerValidator.validate({
      ...validData,
      profile_type: 'teacher',
    })
    assert.equal(result.profile_type, 'teacher')
  })

  test('accepts valid data without optional last_name', async ({ assert }) => {
    const { last_name: omitLastName, ...dataWithoutLastName } = validData
    const result = await registerValidator.validate(dataWithoutLastName)
    assert.equal(result.first_name, 'John')
    assert.notProperty(result, 'last_name')
  })

  test('rejects missing email', async ({ assert }) => {
    const { email: omitEmail, ...data } = validData
    try {
      await registerValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects invalid email format', async ({ assert }) => {
    try {
      await registerValidator.validate({ ...validData, email: 'not-an-email' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects password shorter than 8 characters', async ({ assert }) => {
    try {
      await registerValidator.validate({ ...validData, password: 'short' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects missing first_name', async ({ assert }) => {
    const { first_name: omitFirstName, ...data } = validData
    try {
      await registerValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects invalid profile_type', async ({ assert }) => {
    try {
      await registerValidator.validate({ ...validData, profile_type: 'admin' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects missing birth_date', async ({ assert }) => {
    const { birth_date: omitBirthDate, ...data } = validData
    try {
      await registerValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects empty first_name', async ({ assert }) => {
    try {
      await registerValidator.validate({ ...validData, first_name: '' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects first_name exceeding 100 characters', async ({ assert }) => {
    try {
      await registerValidator.validate({ ...validData, first_name: 'a'.repeat(101) })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('normalizes email to lowercase', async ({ assert }) => {
    const result = await registerValidator.validate({
      ...validData,
      email: 'Test@Example.COM',
    })
    assert.equal(result.email, 'test@example.com')
  })
})
