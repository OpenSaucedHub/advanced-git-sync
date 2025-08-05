// src/handlers/validator/configValidator.ts
import { Config } from '@/src/types'
import * as core from '@actions/core'
import { TokenManager } from './tokenManager'
import { logWarning, ValidationError } from './errors'
import { getGitHubRepo, getGitLabRepo } from '@/src/utils/repoUtils'

/**
 * Validates and enhances the configuration with tokens
 */
export async function validateConfig(config: Config): Promise<Config> {
  try {
    const updatedConfig = { ...config }
    const errors: ValidationError[] = []

    // Handle GitHub configuration
    if (config.github.enabled) {
      const { token, warnings } = TokenManager.getGitHubToken()

      // Log warnings with color and specific codes
      warnings.forEach(warning =>
        logWarning('EAUTH1', warning, { platform: 'GitHub' })
      )

      if (config.gitlab.enabled && !token) {
        errors.push(
          new ValidationError(
            'EAUTH3',
            'GitHub token is required when syncing between GitLab and GitHub',
            { platform: 'GitHub', syncTarget: 'GitLab' }
          )
        )
      }

      // Enhanced dependency logic for GitHub
      if (updatedConfig.github.sync) {
        // 1. Automatically enable tags if releases are enabled but tags are disabled
        if (
          config.github.sync?.releases.enabled &&
          !config.github.sync?.tags.enabled
        ) {
          logWarning(
            'ECFG01',
            'GitHub releases are enabled but tags are disabled. Automatically enabling tag syncing to prevent orphaning releases.',
            { platform: 'GitHub' }
          )
          updatedConfig.github.sync.tags.enabled = true
        }

        // 2. Automatically enable historySync if tags or releases are enabled
        if (
          (config.github.sync?.tags.enabled ||
            config.github.sync?.releases.enabled) &&
          !config.github.sync?.branches.historySync?.enabled
        ) {
          logWarning(
            'ECFG02',
            'GitHub tags/releases are enabled but branch historySync is disabled. Automatically enabling historySync to ensure proper timeline synchronization.',
            { platform: 'GitHub' }
          )
          if (updatedConfig.github.sync.branches.historySync) {
            updatedConfig.github.sync.branches.historySync.enabled = true
          }
        }

        // 3. Automatically enable branches if pullRequests or issues are enabled
        if (
          (config.github.sync?.pullRequests.enabled ||
            config.github.sync?.issues.enabled) &&
          !config.github.sync?.branches.enabled
        ) {
          logWarning(
            'ECFG01',
            "GitHub pull requests/issues are enabled but branches are disabled. Automatically enabling branch syncing as it's required for PR/issue synchronization.",
            { platform: 'GitHub' }
          )
          updatedConfig.github.sync.branches.enabled = true
        }
      }

      updatedConfig.github = {
        ...updatedConfig.github,
        ...(token && { token }),
        ...getGitHubRepo(config)
      }
    }

    // Handle GitLab configuration
    if (config.gitlab.enabled) {
      const { token } = TokenManager.getGitLabToken()

      if (config.github.enabled && !token) {
        errors.push(
          new ValidationError(
            'EAUTH3',
            'GitLab token is required when syncing between GitLab and GitHub',
            { platform: 'GitLab', syncTarget: 'GitHub' }
          )
        )
      }

      // Enhanced dependency logic for GitLab
      if (updatedConfig.gitlab.sync) {
        // 1. Automatically enable tags if releases are enabled but tags are disabled
        if (
          config.gitlab.sync?.releases?.enabled &&
          !config.gitlab.sync?.tags?.enabled
        ) {
          logWarning(
            'ECFG01',
            'GitLab releases are enabled but tags are disabled. Automatically enabling tag syncing to prevent orphaning releases.',
            { platform: 'GitLab' }
          )
          updatedConfig.gitlab.sync.tags.enabled = true
        }

        // 2. Automatically enable historySync if tags or releases are enabled
        if (
          (config.gitlab.sync?.tags?.enabled ||
            config.gitlab.sync?.releases?.enabled) &&
          !config.gitlab.sync?.branches?.historySync?.enabled
        ) {
          logWarning(
            'ECFG02',
            'GitLab tags/releases are enabled but branch historySync is disabled. Automatically enabling historySync to ensure proper timeline synchronization.',
            { platform: 'GitLab' }
          )
          if (updatedConfig.gitlab.sync.branches?.historySync) {
            updatedConfig.gitlab.sync.branches.historySync.enabled = true
          }
        }

        // 3. Automatically enable branches if pullRequests or issues are enabled
        if (
          (config.gitlab.sync?.pullRequests?.enabled ||
            config.gitlab.sync?.issues?.enabled) &&
          !config.gitlab.sync?.branches?.enabled
        ) {
          logWarning(
            'ECFG01',
            "GitLab pull requests/issues are enabled but branches are disabled. Automatically enabling branch syncing as it's required for PR/issue synchronization.",
            { platform: 'GitLab' }
          )
          if (updatedConfig.gitlab.sync.branches) {
            updatedConfig.gitlab.sync.branches.enabled = true
          }
        }
      }

      updatedConfig.gitlab = {
        ...updatedConfig.gitlab,
        ...(token && { token }),
        ...getGitLabRepo(config)
      }
    }

    // Throw errors if any exist
    if (errors.length > 0) {
      core.setFailed('Configuration validation failed')
      errors.forEach(error => error.log())
      throw new ValidationError(
        'EVAL01',
        'Multiple validation errors occurred',
        {
          errorCount: errors.length,
          errors: errors.map(e => e.message)
        }
      )
    }

    return updatedConfig
  } catch (error) {
    // Final catch-all for any unexpected errors
    if (error instanceof ValidationError) {
      throw error
    }

    throw new ValidationError(
      'ECFG01',
      'Unexpected configuration validation error',
      {
        originalError: error instanceof Error ? error.message : String(error)
      }
    )
  } finally {
    core.endGroup()
  }
}
