import { Config } from '../types';
/**
 * Default bot branch patterns used when config.botBranches.patterns is empty
 */
export declare const botDefaults: string[];
/**
 * Protected branches that should never be considered bot branches
 */
export declare const protectedBranches: string[];
/**
 * Returns the default configuration with logical priority-based defaults:
 *
 * PRIORITY LEVELS:
 * - CRITICAL (true): branches + historySync - foundation for everything
 * - HIGH (true): tags, releases - core sync features most users want
 * - MEDIUM (false): pullRequests, issues - can be noisy, user preference
 * - LOW (false): comments - very noisy, advanced feature
 *
 * LOGICAL DEPENDENCIES:
 * - releases enabled → tags auto-enabled (handled in validator)
 * - tags/releases enabled → historySync auto-enabled (handled in validator)
 * - pullRequests/issues enabled → branches auto-enabled (handled in validator)
 */
export declare function getDefaultConfig(): Config;
