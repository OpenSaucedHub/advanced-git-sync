import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from './types'
import { ZodError } from 'zod'
import { getDefaultConfig } from './utils/defaults'
import { validateSyncConfig, validateTokens } from './utils/validator'
import { correctTypos, fixSyntaxErrors, prepareConfig } from './utils/reasoning'

// Utility function to safely log configuration details
function logConfigDetails(config: Partial<Config>, hideTokens = true) {
  const safeConfig = JSON.parse(JSON.stringify(config))

  if (hideTokens) {
    if (safeConfig.gitlab?.token) {
      safeConfig.gitlab.token = '***REDACTED***'
    }
    if (safeConfig.github?.token) {
      safeConfig.github.token = '***REDACTED***'
    }
  }

  core.startGroup('📋 Configuration Details')
  core.info(`\x1b[36m🔧 Platform Configuration:\x1b[0m`)
  core.info(
    `  \x1b[34m🦊 GitLab Enabled:\x1b[0m ${safeConfig.gitlab?.enabled || false}`
  )
  core.info(
    `  \x1b[34m🐱 GitHub Enabled:\x1b[0m ${safeConfig.github?.enabled || false}`
  )
  core.info(`\x1b[36m🔄 Sync Options:\x1b[0m`)
  const syncOptions = JSON.stringify(safeConfig.sync || {}, null, 2)
    .split('\n')
    .map(line => `  \x1b[90m${line}\x1b[0m`)
    .join('\n')
  core.info(syncOptions)
  core.endGroup()
}

function getActionInput(name: string, required = false): string {
  const envValue = process.env[`INPUT_${name.toUpperCase()}`]
  if (envValue !== undefined) {
    return envValue
  }
  return core.getInput(name, { required })
}

export async function getConfig(): Promise<Config> {
  core.startGroup('🔍 Configuration Loading')
  core.info('\x1b[34m🚀 Initializing configuration...\x1b[0m')

  try {
    const CONFIG_PATH = getActionInput('CONFIG_PATH', false)

    if (CONFIG_PATH) {
      core.info(
        `\x1b[36m📂 Using custom configuration file: ${CONFIG_PATH}\x1b[0m`
      )
    }
    const configPath = CONFIG_PATH || '.github/sync-config.yml'

    core.info(
      `\x1b[36m🕵️ Checking for configuration file at: ${configPath}\x1b[0m`
    )

    if (!fs.existsSync(configPath)) {
      core.info(
        '\x1b[33m⚠️ No configuration file found. Using default configuration.\x1b[0m'
      )
      const defaultConfig = await validateConfig(getDefaultConfig())
      logConfigDetails(defaultConfig)
      core.endGroup()
      return defaultConfig
    }

    let configContent = fs.readFileSync(configPath, 'utf8')

    if (!configContent.trim()) {
      core.setFailed(
        '\x1b[31m✗ Configuration file is empty. Please provide a valid configuration or remove the file.\x1b[0m'
      )
      throw new Error('Empty configuration file')
    }

    configContent = fixSyntaxErrors(configContent)

    let parsedConfig: Record<string, unknown>
    try {
      parsedConfig = yaml.load(configContent) as Record<string, unknown>
    } catch (parseError) {
      core.setFailed(
        `\x1b[31m✗ Failed to parse configuration file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}\x1b[0m`
      )
      throw parseError
    }

    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      core.setFailed(
        '\x1b[31m✗ Configuration file is invalid. Please provide a valid configuration.\x1b[0m'
      )
      throw new Error('Invalid configuration')
    }

    parsedConfig = correctTypos(parsedConfig)

    let config: Config
    try {
      const preparedConfig = prepareConfig(parsedConfig)
      config = ConfigSchema.parse(preparedConfig)
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('\n')
        core.warning(
          `\x1b[33m⚠️ Configuration validation warnings:\x1b[0m\n${errorMessages}`
        )
        config = prepareConfig(parsedConfig)
      } else {
        throw error
      }
    }

    config = validateSyncConfig(config)
    const validatedConfig = await validateConfig(config)

    try {
      await validateTokens(validatedConfig)
    } catch (tokenValidationError) {
      const errorMessage =
        tokenValidationError instanceof Error
          ? tokenValidationError.message
          : 'EVLD: Token validation failed'
      core.setFailed(errorMessage)
      throw tokenValidationError
    }

    logConfigDetails(validatedConfig)
    core.endGroup()
    return validatedConfig
  } catch (error) {
    core.endGroup()
    core.warning(
      `\x1b[31m✗ CONFIG: Unexpected error loading config: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m\n\x1b[33m⚠️ Using default configuration.\x1b[0m`
    )
    const defaultConfig = await validateConfig(getDefaultConfig())
    logConfigDetails(defaultConfig)
    return defaultConfig
  }
}

async function validateConfig(config: Config): Promise<Config> {
  try {
    if (config.gitlab.enabled && config.github.enabled) {
      const gitlabToken = getActionInput('GITLAB_TOKEN', false)
      if (!gitlabToken) {
        core.error(
          '\x1b[31m✗ GitLab token is required when syncing between GitLab and GitHub\x1b[0m'
        )
        throw new Error(
          'WFLOW: GitLab token is required when syncing between GitLab and GitHub'
        )
      }
      core.setSecret(gitlabToken)
      core.exportVariable('GITLAB_TOKEN', gitlabToken)

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
      if (githubToken) {
        core.setSecret(githubToken)
        core.exportVariable('GITHUB_TOKEN', githubToken)
      }

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

    if (config.gitlab.enabled) {
      const gitlabToken = getActionInput('GITLAB_TOKEN', false)
      if (gitlabToken) {
        core.setSecret(gitlabToken)
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

    if (config.github.enabled) {
      const githubToken =
        getActionInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN
      if (!getActionInput('GITHUB_TOKEN') && process.env.GITHUB_TOKEN) {
        core.warning(
          '\x1b[33m⚠️ Using default GITHUB_TOKEN. This may have limited permissions. Consider providing a custom token with explicit repository access.\x1b[0m'
        )
      }
      if (!githubToken) {
        core.warning(
          '\x1b[33m⚠️ No GitHub token provided. Sync operations may have limited permissions.\x1b[0m'
        )
      } else {
        core.setSecret(githubToken)
        core.exportVariable('GITHUB_TOKEN', githubToken)
      }
      core.endGroup()
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
