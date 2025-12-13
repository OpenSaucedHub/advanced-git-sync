import { Config } from '../../types'
import deepmerge from 'deepmerge'

/**
 * Merges user config with default config while preserving user inputs
 * @param userConfig Partial user configuration
 * @param defaultConfig Complete default configuration
 * @returns Merged configuration
 */
export function mergeWithDefaults(
  userConfig: Partial<Config>,
  defaultConfig: Config
): Config {
  // Custom merge array function to handle arrays in config
  const mergeArray = (target: any[], source: any[]) => source

  return deepmerge(defaultConfig, userConfig, {
    arrayMerge: mergeArray,
    // Clone objects to avoid mutations
    clone: true
  })
}
