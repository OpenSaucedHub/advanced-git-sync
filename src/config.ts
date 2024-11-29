import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from './types'
import { ZodError } from 'zod'
import { getDefaultConfig } from './utils/defaults'
import { validateSyncConfig, validateTokens } from './utils/validator'

// Utility function to safely log configuration details
function logConfigDetails(config: Partial<Config>, hideTokens = true) {
  // Create a deep copy to avoid mutating the original config
  const safeConfig = JSON.parse(JSON.stringify(config))

  // Mask tokens if requested
  if (hideTokens) {
    if (safeConfig.gitlab?.token) {
      safeConfig.gitlab.token = '***REDACTED***'
    }
    if (safeConfig.github?.token) {
      safeConfig.github.token = '***REDACTED***'
    }
  }

  // Start a group for configuration loading logging
  core.startGroup('📋 Configuration Details')

  // Log the safe configuration with color and emojis
  core.info(`\x1b[36m🔧 Platform Configuration:\x1b[0m`)
  core.info(
    `  \x1b[34m🦊 GitLab Enabled:\x1b[0m ${safeConfig.gitlab?.enabled || false}`
  )
  core.info(
    `  \x1b[34m🐱 GitHub Enabled:\x1b[0m ${safeConfig.github?.enabled || false}`
  )

  // Log sync options with color
  core.info(`\x1b[36m🔄 Sync Options:\x1b[0m`)
  const syncOptions = JSON.stringify(safeConfig.sync || {}, null, 2)
    .split('\n')
    .map(line => `  \x1b[90m${line}\x1b[0m`)
    .join('\n')
  core.info(syncOptions)

  // End the group for configuration loading logging
  core.endGroup()
}

// Helper function to get input that works with both core.getInput and process.env
function getActionInput(name: string, required = false): string {
  // Try getting from environment first (composite actions)
  const envValue = process.env[`INPUT_${name.toUpperCase()}`]
  if (envValue !== undefined) {
    return envValue
  }

  // Fallback to core.getInput (node actions)
  return core.getInput(name, { required })
}

export async function getConfig(): Promise<Config> {
  // Log the start of config loading with a colorful group
  core.startGroup('🔍 Configuration Loading')
  core.info('\x1b[34m🚀 Initializing configuration...\x1b[0m')

  try {
    const CONFIG_PATH = getActionInput('CONFIG_PATH', false)

    // Log configuration path
    if (CONFIG_PATH) {
      core.info(
        `\x1b[36m📂 Using custom configuration file: ${CONFIG_PATH}\x1b[0m`
      )
    }
    const configPath = CONFIG_PATH || '.github/sync-config.yml'

    // Log file existence check
    core.info(
      `\x1b[36m🕵️ Checking for configuration file at: ${configPath}\x1b[0m`
    )

    // If config file doesn't exist, use default configuration
    if (!fs.existsSync(configPath)) {
      core.info(
        '\x1b[33m⚠️ No configuration file found. Using default configuration.\x1b[0m'
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    const configContent = fs.readFileSync(configPath, 'utf8')

    // If config file is empty or just whitespace
    if (!configContent.trim()) {
      core.info(
        '\x1b[33m⚠️ Empty configuration file. Using default configuration.\x1b[0m'
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    const parsedConfig = yaml.load(configContent) as Record<string, unknown>

    // If parsed config is null or empty
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      core.info(
        '\x1b[33m⚠️ Empty or invalid configuration. Using default configuration.\x1b[0m'
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    // Validate the parsed config
    let config = ConfigSchema.parse(parsedConfig)

    // Validate sync configuration and automatically enable tags if needed
    config = validateSyncConfig(config)

    // Validate and augment tokens
    const validatedConfig = await validateConfig(config)

    // Immediately validate tokens and mark the action as failed if invalid
    try {
      await validateTokens(validatedConfig)
    } catch (tokenValidationError) {
      const errorMessage =
        tokenValidationError instanceof Error
          ? tokenValidationError.message
          : 'EVALID: Token validation failed'
      core.setFailed(errorMessage)
      // Throw to prevent further execution
      throw tokenValidationError
    }

    // Log configuration details (with tokens hidden)
    logConfigDetails(validatedConfig)

    core.info('\x1b[32m✅ Configuration loaded successfully!\x1b[0m')
    core.endGroup()
    return validatedConfig
  } catch (error) {
    core.endGroup()

    if (error instanceof ZodError) {
      // Handle Zod validation errors
      const errorMessages = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      core.warning(
        `\x1b[31m✗ ZOD: Config validation failed:\x1b[0m\n${errorMessages}\n\x1b[33m⚠️ Using default configuration.\x1b[0m`
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      return defaultConfig
    }

    if (error instanceof Error) {
      core.warning(
        `\x1b[31m✗ CONFIG: Failed to load config:\x1b[0m ${error.message}\n\x1b[33m⚠️ Using default configuration.\x1b[0m`
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      return defaultConfig
    }

    // Fallback to default config for any unexpected errors
    core.warning(
      '\x1b[31m✗ CONFIG: Unexpected error loading config.\x1b[0m\n\x1b[33m⚠️ Using default configuration.\x1b[0m'
    )
    const defaultConfig = await validateConfig(getDefaultConfig())
    logConfigDetails(defaultConfig)
    return defaultConfig
  }
}

async function validateConfig(config: Config): Promise<Config> {
  // Start a group for token validation logging
  core.startGroup('🔐 Token Configuration')

  try {
    // If both GitLab and GitHub are enabled, tokens are mandatory
    if (config.gitlab.enabled && config.github.enabled) {
      // Validate GitLab token
      const gitlabToken = getActionInput('GITLAB_TOKEN', false)
      if (!gitlabToken) {
        core.error(
          '\x1b[31m✗ GitLab token is required when syncing between GitLab and GitHub\x1b[0m'
        )
        throw new Error(
          'WFLOW: GitLab token is required when syncing between GitLab and GitHub'
        )
      }
      // Securely set the GitLab token as a secret
      core.setSecret(gitlabToken)
      // Export GitLab token to environment
      core.exportVariable('GITLAB_TOKEN', gitlabToken)

      // Validate GitHub token
      const githubToken =
        getActionInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN

      if (!getActionInput('GITHUB_TOKEN') && process.env.GITHUB_TOKEN) {
        core.warning(
          '\x1b[33m⚠️ Using default GITHUB_TOKEN. This may have limited permissions. Consider providing a custom token with explicit repository access.\x1b[0m'
        )
      } else if (!githubToken) {
        core.error(
          '\x1b[31m✗ GitHub token is required when syncing between GitLab and GitHub\x1b[0m'
        )
        throw new Error(
          'WFLOW: GitHub token is required when syncing between GitLab and GitHub'
        )
      }
      // Securely set the GitHub token as a secret
      if (githubToken) {
        core.setSecret(githubToken)
        // Export GitHub token to environment
        core.exportVariable('GITHUB_TOKEN', githubToken)
      }

      core.endGroup()
      return {
        ...config,
        gitlab: {
          ...config.gitlab,
          token: gitlabToken
        },
        github: {
          ...config.github,
          token: githubToken
        }
      }
    }

    // Validate GitLab configuration
    if (config.gitlab.enabled) {
      const gitlabToken = getActionInput('GITLAB_TOKEN', false)

      // Only add token if provided
      if (gitlabToken) {
        // Securely set the GitLab token as a secret
        core.setSecret(gitlabToken)
        // Export GitLab token to environment
        core.exportVariable('GITLAB_TOKEN', gitlabToken)
      }

      core.endGroup()
      return {
        ...config,
        gitlab: {
          ...config.gitlab,
          ...(gitlabToken && { token: gitlabToken })
        }
      }
    }

    // Validate GitHub configuration
    if (config.github.enabled) {
      // Prefer input token, fall back to default GITHUB_TOKEN
      const githubToken =
        getActionInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN

      if (!getActionInput('GITHUB_TOKEN') && process.env.GITHUB_TOKEN) {
        core.warning(
          '\x1b[33m⚠️ Using default GITHUB_TOKEN. This may have limited permissions. ' +
            'Consider providing a custom token with explicit repository access.\x1b[0m'
        )
      }

      if (!githubToken) {
        core.warning(
          '\x1b[33m⚠️ No GitHub token provided. Sync operations may have limited permissions.\x1b[0m'
        )
      } else {
        // Securely set the GitHub token as a secret
        core.setSecret(githubToken)
        // Export GitHub token to environment
        core.exportVariable('GITHUB_TOKEN', githubToken)
      }

      core.endGroup()
      // Add the token to the config at runtime
      return {
        ...config,
        github: {
          ...config.github,
          ...(githubToken && { token: githubToken })
        }
      }
    }

    core.endGroup()
    return config
  } catch (error) {
    core.endGroup()
    throw error
  }
}
