import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from '../types'
import { ZodError } from 'zod'
import { getDefaultConfig } from '@utils/defaults'
import { getActionInput, logConfigDetails } from './inputs'
import { processConfig } from './reason'
import { validateConfig } from './validator'
import { ErrorCodes } from '../utils/errorCodes'

export async function loadConfig(): Promise<Config> {
  // Log the start of config loading with a colorful group
  core.startGroup('🔍 Configuration Loading')
  core.info('\x1b[34m🚀 Initializing configuration...\x1b[0m')

  try {
    const CONFIG_PATH = getActionInput('CONFIG_PATH', false)
    const configPath = CONFIG_PATH || '.github/sync-config.yml'

    // Log configuration path
    if (CONFIG_PATH) {
      core.info(
        `\x1b[36m⚠️ Using custom configuration file: ${CONFIG_PATH}\x1b[0m`
      )
    }

    // If config file doesn't exist, use default configuration
    if (!fs.existsSync(configPath)) {
      core.info(
        `\x1b[33m⚠️ ${ErrorCodes.EFS01}: No configuration file found. Using default configuration.\x1b[0m`
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    const configContent = fs.readFileSync(configPath, 'utf8')

    // If config file is empty or just whitespace
    if (!configContent.trim()) {
      core.endGroup()
      core.setFailed(
        `\x1b[33m⚠️ ${ErrorCodes.ECFG02}: Empty configuration file.\x1b[0m`
      )
    }
    let parsedConfig: Record<string, unknown>

    try {
      parsedConfig = yaml.load(configContent) as Record<string, unknown>
    } catch (yamlError) {
      core.warning(
        `${ErrorCodes.ECFG01}: YAML parsing error: ${(yamlError as Error).message}`
      )
      // Try to fix common YAML syntax errors
      const fixedContent = (configContent as string)
        .replace(/:\s*([truefals]{4,})\s*$/gim, ': $1') // Fix missing quotes
        .replace(/^\s*([^:]+?)\s*[=]\s*(.+)$/gm, '$1: $2') // Fix = instead of :

      try {
        parsedConfig = yaml.load(fixedContent) as Record<string, unknown>
        core.info('⚠️ Fixed YAML syntax errors automatically')
      } catch {
        throw yamlError // If still can't parse, throw original error
      }
    }

    // If parsed config is null or empty
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      core.endGroup()

      core.setFailed('\x1b[33m⚠️ Empty or invalid configuration.\x1b[0m')
    }

    // Process the config, converting boolean-like fields
    const reasonedConfig = processConfig(parsedConfig)

    try {
      // Validate the parsed config
      let config = ConfigSchema.parse(reasonedConfig)

      // Validate and augment tokens
      const validatedConfig = await validateConfig(config)

      // Log configuration details (with tokens hidden)
      logConfigDetails(validatedConfig)

      core.info('\x1b[32m✓ Configuration loaded successfully!\x1b[0m')
      core.endGroup()
      return validatedConfig
    } catch (error) {
      core.endGroup()
      if (error instanceof ZodError) {
        // Handle Zod validation errors
        const errorMessages = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('\n')

        core.setFailed(
          `\x1b[31m❌ Config validation failed:\x1b[0m\n${errorMessages}`
        )
        throw error
      }
      throw error
    }
  } catch (error) {
    core.endGroup()
    if (error instanceof Error) {
      core.setFailed(
        `\x1b[31m❌ Failed to load config: ${error.message}\x1b[0m`
      )
    } else {
      core.setFailed('\x1b[31m❌ Unexpected error loading config.\x1b[0m')
    }
    throw error
  }
}
