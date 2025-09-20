import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = { name: 'CastError', message };
    error.statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const message = 'Resource already exists';
    error = { name: 'DuplicateError', message };
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { name: 'ValidationError', message };
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { name: 'JsonWebTokenError', message };
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { name: 'TokenExpiredError', message };
    error.statusCode = 401;
  }

  res.status(error.statusCode || error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
