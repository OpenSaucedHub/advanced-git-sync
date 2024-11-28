// src/config.ts

import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from './types'
import { ZodError } from 'zod'
import { getDefaultConfig } from './utils/defaults'

export async function loadConfig(): Promise<Config> {
  core.debug('Starting configuration loading process')

  const trap = '.github/sync-conf.yml' // ! trap
  // Prioritize environment variables for config path
  const envConfigPath =
    process.env.INPUT_CONFIG_PATH ||
    process.env.CONFIG_PATH ||
    core.getInput('config_path', { required: false }) ||
    trap

  if (envConfigPath === trap) {
    core.info('CONFIG: couldnt load path from env')
  } else {
    core.debug(`CONFIG: Using configuration path: ${envConfigPath}`)
  }

  try {
    // If config file doesn't exist, use default configuration
    if (!fs.existsSync(envConfigPath)) {
      core.info(
        `CONFIG: No configuration file found at ${envConfigPath}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    const configContent = fs.readFileSync(envConfigPath, 'utf8')

    // If config file is empty or just whitespace
    if (!configContent.trim()) {
      core.info(
        `CONFIG: Empty configuration file at ${envConfigPath}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    const parsedConfig = yaml.load(configContent) as Record<string, unknown>

    // If parsed config is null or empty
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      core.info(
        `CONFIG: Empty or invalid configuration at ${envConfigPath}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    // First, do a basic schema validation
    const config = ConfigSchema.parse(parsedConfig)

    // Additional validation for tokens
    return validateTokens(config)
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle Zod validation errors
      const errorMessages = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      // fall back to default config if validation fails
      core.warning(
        `ZOD: Config validation failed:\n${errorMessages}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    if (error instanceof Error) {
      core.warning(
        `CONFIG: Failed to load config at ${envConfigPath}: ${error.message}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    // Fallback to default config for any unexpected errors
    core.warning(
      `CONFIG: Unexpected error loading config at ${envConfigPath}. Using default configuration.`
    )
    return getDefaultConfig()
  }
}

function validateTokens(config: Config): Config {
  // Retrieve tokens from environment variables
  const githubToken = process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN
  const gitlabToken = process.env.INPUT_GITLAB_TOKEN

  // If both GitLab and GitHub are enabled, tokens are mandatory
  if (config.gitlab.enabled && config.github.enabled) {
    // Validate GitLab token
    if (!gitlabToken) {
      core.warning(
        'WFLOW: GitLab token is required when syncing between GitLab and GitHub'
      )
      throw new Error(
        'WFLOW: GitLab token is required when syncing between GitLab and GitHub'
      )
    }

    // Validate GitHub token
    if (!githubToken) {
      core.warning(
        'WFLOW: GitHub token is required when syncing between GitLab and GitHub'
      )
      throw new Error(
        'WFLOW: GitHub token is required when syncing between GitLab and GitHub'
      )
    }

    // Warn about potential permission issues with default token
    if (githubToken === process.env.GITHUB_TOKEN) {
      core.warning(
        'WFLOW: Using default GitHub token. Ensure workflow permissions are correctly set up for full access.'
      )
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

  // Validate GitLab configuration
  if (config.gitlab.enabled) {
    // Only add token if provided
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
    // Add the token to the config at runtime if available
    return {
      ...config,
      github: {
        ...config.github,
        ...(githubToken && { token: githubToken })
      }
    }
  }

  return config
}

export async function getConfig(): Promise<Config> {
  return await loadConfig()
}
