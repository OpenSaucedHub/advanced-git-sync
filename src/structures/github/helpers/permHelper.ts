import * as core from '@actions/core'
import { Repository, Config, PermissionCheck } from '@/src/types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import { BaseClient } from '../../baseClient'

export class permHelper extends BaseClient {
  private octokit: any

  constructor(octokit: any, repo: Repository, config: Config) {
    super(config, repo)
    this.octokit = octokit
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

      // Verify repository access first
      await this.octokit.rest.repos.get({ ...this.repo })
      core.info(`\x1b[32m✓ Repository access verified\x1b[0m`)

      await this.validatePermissions(
        'github',
        this.config.github.sync,
        permissionChecks
      )
    } catch (error) {
      throw new Error(
        `${ErrorCodes.EGHUB}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
