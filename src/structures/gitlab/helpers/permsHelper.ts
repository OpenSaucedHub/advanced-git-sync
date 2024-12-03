import { PermissionValidator } from '@/src/handlers/validator'
import { Config, PermissionCheck, Repository } from '@/src/types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import * as core from '@actions/core'

export class permsHelper {
  private getProjectId: () => Promise<number>
  constructor(
    private gitlab: any,
    private repo: Repository,
    private config: Config,
    projectIdGetter: () => Promise<number>
  ) {
    this.getProjectId = projectIdGetter
  }

  async validateAccess(): Promise<void> {
    try {
      core.info('GitLab Access Validation')

      const projectId = await this.getProjectId()
      core.info(
        `\x1b[32m✓ Validating access using Project ID: ${projectId}\x1b[0m`
      )

      const permissionChecks: PermissionCheck[] = [
        {
          feature: 'issues',
          check: async () => {
            const issues = await this.gitlab.Issues.all({ projectId })
            return Array.isArray(issues)
          },
          warningMessage: `${ErrorCodes.EPERM2}: Issues read/write permissions missing`
        },
        {
          feature: 'mergeRequests',
          check: async () => {
            const mrs = await this.gitlab.MergeRequests.all({ projectId })
            return Array.isArray(mrs)
          },
          warningMessage: `${ErrorCodes.EPERM3}: Merge requests read/write permissions missing`
        },
        {
          feature: 'releases',
          check: async () => {
            const releases = await this.gitlab.ProjectReleases.all(projectId)
            return Array.isArray(releases)
          },
          warningMessage: `${ErrorCodes.EPERM4}: Releases read/write permissions missing`
        }
      ]

      await PermissionValidator.validatePlatformPermissions(
        'gitlab',
        permissionChecks,
        this.config.gitlab.sync,
        `${this.repo.owner}/${this.repo.repo}`
      )

      core.info(
        `\x1b[32m✓ GitLab Project Access Verified: ${this.repo.owner}/${this.repo.repo}; Project ID: ${projectId}\x1b[0m`
      )
    } catch (error) {
      core.error('GitLab access validation failed')
      throw new Error(
        `${ErrorCodes.EGLAB}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
