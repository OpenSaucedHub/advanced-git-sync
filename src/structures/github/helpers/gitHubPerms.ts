import { PermissionValidator } from '@/src/handlers/validator'
import { Config, PermissionCheck, Repository } from '@/src/types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import * as core from '@actions/core'

export class githubPermsHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async validateAccess(): Promise<void> {
    try {
      const permissionChecks: PermissionCheck[] = [
        {
          feature: 'issues',
          check: () => this.octokit.rest.issues.listForRepo({ ...this.repo }),
          warningMessage: `${ErrorCodes.EPERM2}: Issues read/write permissions missing`
        },
        {
          feature: 'pullRequests',
          check: () => this.octokit.rest.pulls.list({ ...this.repo }),
          warningMessage: `${ErrorCodes.EPERM3}: Pull requests read/write permissions missing`
        },
        {
          feature: 'releases',
          check: () => this.octokit.rest.repos.listReleases({ ...this.repo }),
          warningMessage: `${ErrorCodes.EPERM4}: Releases read/write permissions missing`
        }
      ]

      // Verify repository access first - with potential repository creation
      try {
        await this.octokit.rest.repos.get({ ...this.repo })
      } catch (error: any) {
        if (error.status === 404 && this.config.github.createIfNotExists) {
          core.info(
            `Repository ${this.repo.owner}/${this.repo.repo} not found, attempting to create it...`
          )
          // Note: We can't call createRepositoryIfNotExists here directly as it would create circular dependency
          // We'll handle this in the client validation flow instead
          throw new Error(
            `REPO_NOT_FOUND: Repository ${this.repo.owner}/${this.repo.repo} does not exist`
          )
        } else {
          throw error
        }
      }

      await PermissionValidator.validatePlatformPermissions(
        'github',
        permissionChecks,
        this.config.github.sync, // or gitlab.sync
        `${this.repo.owner}/${this.repo.repo}`
      )

      core.info('\x1b[32m✓ Repository Access Verified\x1b[0m')
    } catch (error) {
      throw new Error(
        `${ErrorCodes.EGHUB}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
