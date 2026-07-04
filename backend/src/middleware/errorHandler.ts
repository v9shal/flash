import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError.js'
import logger from '../utils/logger.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {

  if (err instanceof AppError) {
    logger.warn({
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
    }, 'Operational error')

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code ?? null,
    })
    return
  }

  logger.error({
    err,
    path: req.path,
    method: req.method,
  }, 'Unexpected error')

  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
  })
}