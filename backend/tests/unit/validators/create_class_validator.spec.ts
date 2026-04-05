import { test } from '@japa/runner'
import { createClassValidator } from '#validators/class_validator'

const validSchedule = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
}

const validData = {
  name: 'BJJ Fundamentals',
  martial_art: 'Brazilian Jiu-Jitsu (BJJ)',
  has_belt_system: true,
  description: 'Beginner class',
  schedules: [validSchedule],
}

test.group('createClassValidator', () => {
  test('accepts valid class data', async ({ assert }) => {
    const result = await createClassValidator.validate(validData)
    assert.equal(result.name, 'BJJ Fundamentals')
    assert.equal(result.martial_art, 'Brazilian Jiu-Jitsu (BJJ)')
    assert.isTrue(result.has_belt_system)
    assert.lengthOf(result.schedules, 1)
  })

  test('accepts valid data with multiple schedules', async ({ assert }) => {
    const result = await createClassValidator.validate({
      ...validData,
      schedules: [validSchedule, { day_of_week: 3, start_time: '14:00', end_time: '15:30' }],
    })
    assert.lengthOf(result.schedules, 2)
  })

  test('accepts valid data without description (nullable)', async ({ assert }) => {
    const result = await createClassValidator.validate({
      ...validData,
      description: null,
    })
    assert.isNull(result.description)
  })

  test('accepts valid data with has_belt_system false', async ({ assert }) => {
    const result = await createClassValidator.validate({
      ...validData,
      has_belt_system: false,
    })
    assert.isFalse(result.has_belt_system)
  })

  test('rejects missing name', async ({ assert }) => {
    const { name: omitName, ...data } = validData
    try {
      await createClassValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects name shorter than 3 characters', async ({ assert }) => {
    try {
      await createClassValidator.validate({ ...validData, name: 'AB' })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects missing martial_art', async ({ assert }) => {
    const { martial_art: omitMartialArt, ...data } = validData
    try {
      await createClassValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects missing has_belt_system', async ({ assert }) => {
    const { has_belt_system: omitBeltSystem, ...data } = validData
    try {
      await createClassValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects empty schedules array', async ({ assert }) => {
    try {
      await createClassValidator.validate({ ...validData, schedules: [] })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects missing schedules', async ({ assert }) => {
    const { schedules: omitSchedules, ...data } = validData
    try {
      await createClassValidator.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects invalid schedule day_of_week below 0', async ({ assert }) => {
    try {
      await createClassValidator.validate({
        ...validData,
        schedules: [{ ...validSchedule, day_of_week: -1 }],
      })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects invalid schedule day_of_week above 6', async ({ assert }) => {
    try {
      await createClassValidator.validate({
        ...validData,
        schedules: [{ ...validSchedule, day_of_week: 7 }],
      })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('rejects non-integer schedule day_of_week', async ({ assert }) => {
    try {
      await createClassValidator.validate({
        ...validData,
        schedules: [{ ...validSchedule, day_of_week: 1.5 }],
      })
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('accepts all valid day_of_week values (0-6)', async ({ assert }) => {
    for (let day = 0; day <= 6; day++) {
      const result = await createClassValidator.validate({
        ...validData,
        schedules: [{ ...validSchedule, day_of_week: day }],
      })
      assert.equal(result.schedules[0].day_of_week, day)
    }
  })
})
