import { PermissionCheck, Config } from '@/src/types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import * as core from '@actions/core'
import { GitHubClient } from '../../structures/github/GitHub.js'
import { GitLabClient } from '../../structures/gitlab/GitLab.js'

export class PermissionValidator {
  /**
   * Validates permissions for a specific platform
   */
  static async validatePlatformPermissions(
    platform: 'github' | 'gitlab',
    checks: PermissionCheck[],
    sync: any,
    repoInfo: string
  ): Promise<void> {
    core.info(`🔍 ${platform.toUpperCase()} Permissions Validation`)
    core.info(
      `\x1b[36mValidating ${platform} permissions for: ${repoInfo}\x1b[0m`
    )

    for (const check of checks) {
      if (sync?.[check.feature as keyof typeof sync]?.enabled) {
        try {
          await check.check()
          core.info(`\x1b[32m✓ ${check.feature} permissions verified\x1b[0m`)
        } catch {
          const errorMessage = `${platform}: ${check.warningMessage}`
          core.setFailed(`\x1b[31m✖ ${errorMessage}\x1b[0m`)
          throw new Error(errorMessage)
        }
      }
    }

    core.endGroup()
  }

  /**
   * Validates permissions for both GitHub and GitLab
   */
  static async validatePermissions(config: Config): Promise<void> {
    try {
      if (config.github.enabled && config.github.token) {
        const githubClient = new GitHubClient(config)
        await githubClient.validateAccess()
      }

      if (config.gitlab.enabled && config.gitlab.token) {
        const gitlabClient = new GitLabClient(config)
        await gitlabClient.validateAccess()
      }

      core.info('\x1b[32m✓ Permission validation completed successfully\x1b[0m')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      core.setFailed(message)
      throw new Error(`${ErrorCodes.EPERM1}: ${message}`)
    }
  }
}
