import { Config } from '@/src/types'
import * as core from '@actions/core'
import { TokenManager } from './tokenManager'
import { logWarning, ValidationError } from './errors'
import { getGitHubRepo, getGitLabRepo } from '@/src/utils/repoUtils'
import { PermissionValidator } from './permValidator'

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

      // Automatically enable tags if releases are enabled but tags are disabled
      if (
        config.github.sync?.releases.enabled &&
        !config.github.sync?.tags.enabled
      ) {
        logWarning(
          'ECFG01',
          'GitHub releases are enabled but tags are disabled. Automatically enabling tag syncing to prevent orphaning releases.',
          { platform: 'GitHub' }
        )

        if (updatedConfig.github.sync) {
          updatedConfig.github.sync.tags.enabled = true
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

      // Automatically enable tags if releases are enabled but tags are disabled
      if (
        config.gitlab.sync?.releases?.enabled &&
        !config.gitlab.sync?.tags?.enabled
      ) {
        logWarning(
          'ECFG01',
          'GitLab releases are enabled but tags are disabled. Automatically enabling tag syncing to prevent orphaning releases.',
          { platform: 'GitLab' }
        )

        if (updatedConfig.gitlab.sync) {
          updatedConfig.gitlab.sync.tags.enabled = true
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

    // Validate token permissions if tokens are present
    try {
      if (updatedConfig.github.token || updatedConfig.gitlab.token) {
        await PermissionValidator.validatePermissions(updatedConfig)
      }
    } catch (permError) {
      throw new ValidationError(
        'EPERM1',
        'Token permission validation failed',
        {
          originalError:
            permError instanceof Error ? permError.message : String(permError),
          platforms: [
            ...(updatedConfig.github.token ? ['GitHub'] : []),
            ...(updatedConfig.gitlab.token ? ['GitLab'] : [])
          ]
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
