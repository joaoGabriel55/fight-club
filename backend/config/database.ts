import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const databaseUrl = env.get('DATABASE_URL')

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: databaseUrl
        ? {
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: env.get('DB_HOST'),
            port: env.get('DB_PORT'),
            user: env.get('DB_USER'),
            password: env.get('DB_PASSWORD'),
            database: env.get('DB_DATABASE'),
          },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
