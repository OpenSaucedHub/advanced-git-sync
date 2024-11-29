import { Config } from '../types';
/**
 * Validates both GitHub and GitLab tokens based on the configuration
 */
export declare function validateTokens(config: Config): Promise<void>;
/**
 * Validates and adjusts sync configuration settings
 * Ensures proper relationship between releases and tags
 */
export declare function validateSyncConfig(config: Config): Config;
