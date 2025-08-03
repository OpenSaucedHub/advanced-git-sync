import { Repository, Config } from '../types';
/**
 * Convert glob pattern to regex pattern
 * Handles common glob patterns used for branch matching
 */
export declare function globToRegex(pattern: string): RegExp;
export declare function getGitHubRepo(config: Config): Repository;
export declare function getGitLabRepo(config: Config): Repository;
