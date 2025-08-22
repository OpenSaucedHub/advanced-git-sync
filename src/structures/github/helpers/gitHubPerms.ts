import { PermissionValidator } from '@/src/handlers/validator'
import { Config, PermissionCheck, Repository } from '@/src/types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import * as core from '@actions/core'
import { githubRepoHelper } from './gitHubRepo'

export class githubPermsHelper {
  private repoCreator: githubRepoHelper

  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {
    this.repoCreator = new githubRepoHelper(this.octokit, this.repo)
  }

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

      // Try to create repository if it doesn't exist, then verify access
      await this.repoCreator.createIfNotExists()
      await this.octokit.rest.repos.get({ ...this.repo })

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
