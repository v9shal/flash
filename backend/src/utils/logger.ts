// src/utils/logger.ts
import pino from 'pino'
import { env } from '../config/env.js'

const logger = pino({
  level: env.LOG_LEVEL ?? 'info',

  // Pretty print in development, JSON in production
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),

  // Redact sensitive fields — they show as [Redacted] in logs
  redact: {
    paths: [
      'password',
      'password_hash',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'req.headers.authorization',
      'idempotency_key',
      'card_number',
    ],
    censor: '[Redacted]',
  },

  // Base fields on every log line
  base: {
    env: env.NODE_ENV,
  },
})

export default logger