import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from './types'
import { ZodError } from 'zod'
import { getDefaultConfig } from './utils/defaults'
import { validateTokens } from './utils/validator'

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

  // Log the safe configuration
  core.info(`CONFIG: Loaded configuration details:
  GitLab Enabled: ${safeConfig.gitlab?.enabled || false}
  GitHub Enabled: ${safeConfig.github?.enabled || false}
  Sync Options: ${JSON.stringify(safeConfig.sync || {}, null, 2)}`)
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
  // Log the start of config loading
  core.startGroup('Configuration Loading')

  try {
    const CONFIG_PATH = getActionInput('CONFIG_PATH', false)

    // Log configuration path
    if (CONFIG_PATH) {
      core.info(`CONFIG: Using custom configuration file: ${CONFIG_PATH}`)
    }
    const configPath = CONFIG_PATH || '.github/sync-config.yml'

    // Log file existence check
    core.info(`CONFIG: Checking for configuration file at: ${configPath}`)

    // If config file doesn't exist, use default configuration
    if (!fs.existsSync(configPath)) {
      core.info(
        'CONFIG: No configuration file found. Using default configuration.'
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    const configContent = fs.readFileSync(configPath, 'utf8')
    core.info(`CONFIG: Configuration file size: ${configContent.length} bytes`)

    // If config file is empty or just whitespace
    if (!configContent.trim()) {
      core.info(
        'CONFIG: Empty configuration file. Using default configuration.'
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
        'CONFIG: Empty or invalid configuration. Using default configuration.'
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    // Validate the parsed config
    const config = ConfigSchema.parse(parsedConfig)

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
        `ZOD: Config validation failed:\n${errorMessages}. Using default configuration.`
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      return defaultConfig
    }

    if (error instanceof Error) {
      core.warning(
        `CONFIG: Failed to load config: ${error.message}. Using default configuration.`
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      return defaultConfig
    }

    // Fallback to default config for any unexpected errors
    core.warning(
      'CONFIG: Unexpected error loading config. Using default configuration.'
    )
    const defaultConfig = await validateConfig(getDefaultConfig())
    logConfigDetails(defaultConfig)
    return defaultConfig
  }
}

async function validateConfig(config: Config): Promise<Config> {
  // Start a group for token validation logging
  core.startGroup('Token Validation')

  try {
    // If both GitLab and GitHub are enabled, tokens are mandatory
    if (config.gitlab.enabled && config.github.enabled) {
      // Validate GitLab token
      const gitlabToken = getActionInput('GITLAB_TOKEN', false)
      if (!gitlabToken) {
        core.warning(
          'WFLOW: GitLab token is required when syncing between GitLab and GitHub'
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
          'WFLOW: Using default GITHUB_TOKEN. This may have limited permissions. Consider providing a custom token with explicit repository access.'
        )
      } else if (!githubToken) {
        core.warning(
          'WFLOW: GitHub token is required when syncing between GitLab and GitHub'
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
          'WFLOW: Using default GITHUB_TOKEN. This may have limited permissions. ' +
            'Consider providing a custom token with explicit repository access.'
        )
      }

      if (!githubToken) {
        core.warning(
          'WFLOW: No GitHub token provided. Sync operations may have limited permissions.'
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
