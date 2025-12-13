import { PermissionValidator } from '@/src/handlers/validator'
import { Config, PermissionCheck, Repository } from '../../types'
import { ErrorCodes } from '@/src/utils/errorCodes'
import * as core from '@actions/core'
import { RepoHelper } from './repoHelper'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class PermsHelper {
  private repoCreator: RepoHelper

  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository,
    private config: Config,
    private getProjectId?: () => Promise<number>
  ) {
    this.repoCreator = new RepoHelper(this.client, this.platform, this.repo)
  }

  async validateAccess(): Promise<void> {
    if (this.platform === 'github') {
      return this.validateGitHubAccess()
    } else {
      return this.validateGitLabAccess()
    }
  }

  private async validateGitHubAccess(): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const permissionChecks: PermissionCheck[] = [
        {
          feature: 'issues',
          check: () => octokit.rest.issues.listForRepo({ ...this.repo }),
          warningMessage: `${ErrorCodes.EPERM2}: Issues read/write permissions missing`
        },
        {
          feature: 'pullRequests',
          check: () => octokit.rest.pulls.list({ ...this.repo }),
          warningMessage: `${ErrorCodes.EPERM3}: Pull requests read/write permissions missing`
        },
        {
          feature: 'releases',
          check: () => octokit.rest.repos.listReleases({ ...this.repo }),
          warningMessage: `${ErrorCodes.EPERM4}: Releases read/write permissions missing`
        }
      ]

      await this.repoCreator.createIfNotExists()
      await octokit.rest.repos.get({ ...this.repo })

      await PermissionValidator.validatePlatformPermissions(
        'github',
        permissionChecks,
        this.config.github.sync,
        `${this.repo.owner}/${this.repo.repo}`
      )

      core.info('\x1b[32m✓ Repository Access Verified\x1b[0m')
    } catch (error) {
      throw new Error(
        `${ErrorCodes.EGHUB}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async validateGitLabAccess(): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      core.info('GitLab Access Validation')

      const projectId = await this.getProjectId!()
      core.info(
        `\x1b[32m✓ Validating access using Project ID: ${projectId}\x1b[0m`
      )

      const permissionChecks: PermissionCheck[] = [
        {
          feature: 'issues',
          check: async () => {
            const issues = await gitlab.Issues.all({ projectId })
            return Array.isArray(issues)
          },
          warningMessage: `${ErrorCodes.EPERM2}: Issues read/write permissions missing`
        },
        {
          feature: 'mergeRequests',
          check: async () => {
            const mrs = await gitlab.MergeRequests.all({ projectId })
            return Array.isArray(mrs)
          },
          warningMessage: `${ErrorCodes.EPERM3}: Merge requests read/write permissions missing`
        },
        {
          feature: 'releases',
          check: async () => {
            const releases = await gitlab.ProjectReleases.all(projectId)
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
