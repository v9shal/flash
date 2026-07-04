import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Global error-handling middleware.
 * Must be registered LAST with app.use().
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
  })   
}