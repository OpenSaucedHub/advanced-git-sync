// src/config.ts

import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from './types'
import { ZodError } from 'zod'
import { getDefaultConfig } from './utils/defaults'

export async function loadConfig(): Promise<Config> {
  const configPath =
    core.getInput('config_path', { required: false }) ||
    '.github/sync-config.yml'

  try {
    // If config file doesn't exist, use default configuration
    if (!fs.existsSync(configPath)) {
      core.info('No configuration file found. Using default configuration.')
      return getDefaultConfig()
    }

    const configContent = fs.readFileSync(configPath, 'utf8')

    // If config file is empty or just whitespace
    if (!configContent.trim()) {
      core.info('Empty configuration file. Using default configuration.')
      return getDefaultConfig()
    }

    const parsedConfig = yaml.load(configContent) as Record<string, unknown>

    // If parsed config is null or empty
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      core.info('Empty or invalid configuration. Using default configuration.')
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

      // Optionally, fall back to default config if validation fails
      core.warning(
        `Config validation failed:\n${errorMessages}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    if (error instanceof Error) {
      core.warning(
        `Failed to load config: ${error.message}. Using default configuration.`
      )
      return getDefaultConfig()
    }

    // Fallback to default config for any unexpected errors
    core.warning(
      'Unexpected error loading config. Using default configuration.'
    )
    return getDefaultConfig()
  }
}

function validateTokens(config: Config): Config {
  // If both GitLab and GitHub are enabled, tokens are mandatory
  if (config.gitlab.enabled && config.github.enabled) {
    // Validate GitLab token
    const gitlabToken = core.getInput('gitlab_token', { required: false })
    if (!gitlabToken) {
      throw new Error(
        'GitLab token is required when syncing between GitLab and GitHub'
      )
    }

    // Validate GitHub token
    const githubToken =
      core.getInput('github_token') || process.env.GITHUB_TOKEN

    if (!githubToken) {
      throw new Error(
        'GitHub token is required when syncing between GitLab and GitHub'
      )
    }

    // Warn about potential permission issues with default token
    if (githubToken === process.env.GITHUB_TOKEN) {
      core.warning(
        'Using default GitHub token. Ensure workflow permissions are correctly set up for full access.'
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
    const gitlabToken = core.getInput('gitlab_token', { required: false })

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
    // Prefer input token, fall back to default GITHUB_TOKEN
    const githubToken =
      core.getInput('github_token') || process.env.GITHUB_TOKEN

    if (!githubToken) {
      core.warning(
        'No GitHub token provided. Sync operations may have limited permissions.'
      )
    }

    // Add the token to the config at runtime
    return {
      ...config,
      github: {
        ...config.github,
        token: githubToken
      }
    }
  }

  return config
}

export async function getConfig(): Promise<Config> {
  return await loadConfig()
}
