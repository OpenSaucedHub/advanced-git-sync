import { BaseClient } from '@/src/structures/baseClient'
import { Repository, PermissionCheck, Config } from '@/src/types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import * as core from '@actions/core'

export class PermissionHelper extends BaseClient {
  private gitlab: any

  constructor(gitlab: any, repo: Repository, config: Config) {
    super(config, repo)
    this.gitlab = gitlab
  }

  private get projectPath(): string {
    return encodeURIComponent(`${this.repo.owner}/${this.repo.repo}`)
  }

  async validateAccess(): Promise<void> {
    try {
      const permissionChecks: PermissionCheck[] = [
        {
          feature: 'issues',
          check: () =>
            this.gitlab.Issues.all({ projectId: this.projectPath, perPage: 1 }),
          warningMessage: `${ErrorCodes.EPERM2}: Issues read/write permissions missing`
        },
        {
          feature: 'pullRequests',
          check: () =>
            this.gitlab.MergeRequests.all({
              projectId: this.projectPath,
              perPage: 1
            }),
          warningMessage: `${ErrorCodes.EPERM3}: Merge requests read/write permissions missing`
        },
        {
          feature: 'releases',
          check: () => this.gitlab.ProjectReleases.all(this.projectPath),
          warningMessage: `${ErrorCodes.EPERM4}: Releases read/write permissions missing`
        }
      ]

      // Verify repository access first
      await this.gitlab.Projects.show(this.projectPath)
      core.info(`\x1b[32m✓ Repository access verified\x1b[0m`)

      // Validate permissions using the base client method
      await this.validatePermissions(
        'gitlab',
        this.config.gitlab.sync,
        permissionChecks
      )
    } catch (error) {
      throw new Error(
        `${ErrorCodes.EGLAB}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
