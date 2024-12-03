import { Config } from '../types';
/**
 * Merges user config with default config while preserving user inputs
 * @param userConfig Partial user configuration
 * @param defaultConfig Complete default configuration
 * @returns Merged configuration
 */
export declare function mergeWithDefaults(userConfig: Partial<Config>, defaultConfig: Config): Config;
