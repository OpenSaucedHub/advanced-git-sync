import { ErrorCodes } from '@utils/errorCodes'
import * as core from '@actions/core'

/**
 * Custom error class for GitHub Action validation errors
 */
export class ValidationError extends Error {
  /**
   * Error code from ErrorCodes
   */
  public readonly code: keyof typeof ErrorCodes

  /**
   * Additional context about the error
   */
  public readonly context?: Record<string, unknown>

  constructor(
    code: keyof typeof ErrorCodes,
    message?: string,
    context?: Record<string, unknown>
  ) {
    const fullMessage = `[${code}] ${ErrorCodes[code]}${message ? `: ${message}` : ''}`
    super(fullMessage)

    this.name = 'ValidationError'
    this.code = code
    this.context = context

    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }

  /**
   * Log error using GitHub Actions core logger
   */
  log() {
    core.error(this.message)

    // Optionally log context if available
    if (this.context) {
      core.error(JSON.stringify(this.context, null, 2))
    }
  }
}

/**
 * Helper function to log warnings
 */
export function logWarning(
  code: keyof typeof ErrorCodes,
  message?: string,
  context?: Record<string, unknown>
) {
  const fullMessage = `[${code}] ${ErrorCodes[code]}${message ? `: ${message}` : ''}`
  core.warning(fullMessage)

  if (context) {
    core.warning(JSON.stringify(context, null, 2))
  }
}
