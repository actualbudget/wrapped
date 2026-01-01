/**
 * Custom error types for the application
 */

export class FileApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FileApiError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    const ErrorConstructor = Error as unknown as {
      captureStackTrace?: (error: Error, constructor: typeof FileApiError) => void;
    };
    if (typeof ErrorConstructor.captureStackTrace === "function") {
      ErrorConstructor.captureStackTrace(this, FileApiError);
    }
  }
}

export class DatabaseError extends FileApiError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "DatabaseError";
  }
}

export class FileValidationError extends FileApiError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "FileValidationError";
  }
}

export class DataTransformError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataTransformError";
    const ErrorConstructor = Error as unknown as {
      captureStackTrace?: (error: Error, constructor: typeof DataTransformError) => void;
    };
    if (typeof ErrorConstructor.captureStackTrace === "function") {
      ErrorConstructor.captureStackTrace(this, DataTransformError);
    }
  }
}

/**
 * Type guard to check if an error is a FileApiError
 */
export function isFileApiError(error: unknown): error is FileApiError {
  return error instanceof FileApiError;
}

/**
 * Type guard to check if an error is a DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Type guard to check if an error is a FileValidationError
 */
export function isFileValidationError(error: unknown): error is FileValidationError {
  return error instanceof FileValidationError;
}

/**
 * Type guard to check if an error is a DataTransformError
 */
export function isDataTransformError(error: unknown): error is DataTransformError {
  return error instanceof DataTransformError;
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
