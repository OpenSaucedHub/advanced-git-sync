import { ErrorCodes } from '@utils/errorCodes';
/**
 * Custom error class for GitHub Action validation errors
 */
export declare class ValidationError extends Error {
    /**
     * Error code from ErrorCodes
     */
    readonly code: keyof typeof ErrorCodes;
    /**
     * Additional context about the error
     */
    readonly context?: Record<string, unknown>;
    constructor(code: keyof typeof ErrorCodes, message?: string, context?: Record<string, unknown>);
    /**
     * Log error using GitHub Actions core logger
     */
    log(): void;
}
/**
 * Helper function to log warnings
 */
export declare function logWarning(code: keyof typeof ErrorCodes, message?: string, context?: Record<string, unknown>): void;
