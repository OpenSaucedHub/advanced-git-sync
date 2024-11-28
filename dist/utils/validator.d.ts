import { Config } from '../types';
/**
 * Validates both GitHub and GitLab tokens based on the configuration
 */
export declare function validateTokens(config: Config): Promise<void>;
