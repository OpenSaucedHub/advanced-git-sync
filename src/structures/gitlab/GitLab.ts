import * as core from '@actions/core'
import { Gitlab } from '@gitbeaker/rest'
import { Repository, Config, PermissionCheck } from '@/src/types'
import {
  BranchHelper,
  IssueHelper,
  PullRequestHelper,
  ReleaseHelper,
  TagHelper
} from './helpers'
import { BaseClient } from '../baseClient'
import { ErrorCodes } from '@/src/utils/errorCodes'

export class GitLabClient extends BaseClient {
  private gitlab
  public branches: BranchHelper
  public issues: IssueHelper
  public pullRequest: PullRequestHelper
  public release: ReleaseHelper
  public tags: TagHelper

  private projectId: number | null = null

  constructor(config: Config, repo?: Repository) {
    super(config, repo || { owner: '', repo: '' })

    if (!config.gitlab?.token) {
      throw new Error(`${ErrorCodes.EGLAB}: GitLab token is required`)
    }

    const host = config.gitlab.url || 'https://gitlab.com'
    core.info(`🦊 Initializing GitLab client for host: ${host}`)

    this.gitlab = new Gitlab({
      token: config.gitlab.token,
      host,
      prefixUrl: `${host}/api/v4`, // Explicitly set base URL with version
      rejectUnauthorized: false
    })

    // Initialize helpers
    this.branches = new BranchHelper(this.gitlab, this.repo, this.config)
    this.issues = new IssueHelper(this.gitlab, this.repo, this.config)
    this.pullRequest = new PullRequestHelper(
      this.gitlab,
      this.repo,
      this.config
    )
    this.release = new ReleaseHelper(this.gitlab, this.repo, this.config)
    this.tags = new TagHelper(this.gitlab, this.repo, this.config)
    this.projectId = config.gitlab.projectId || null
  }

  /**
   * Get the unique project ID from GitLab
   * @returns Promise<number> The unique project ID
   */
  private async getProjectId(): Promise<number> {
    // Return cached project ID if available
    if (this.projectId) {
      core.debug(`Using cached project ID: ${this.projectId}`)
      return this.projectId
    }

    const projectPath = `${this.repo.owner}/${this.repo.repo}`
    core.info(`📂 Attempting to fetch project ID for: ${projectPath}`)

    try {
      if (this.config.gitlab.projectId) {
        // Use provided project ID
        this.projectId = this.config.gitlab.projectId
        core.info(
          `\x1b[32m✓ Using configured project ID: ${this.projectId}\x1b[0m`
        )
      } else {
        // Fetch project ID from GitLab API
        const project = await this.gitlab.Projects.show(
          projectPath.replace('/', '%2F')
        )

        if (!project?.id) {
          throw new Error('Project ID not found in response')
        }

        this.projectId = project.id

        // Store the project ID in config for reuse
        if (this.config.gitlab) {
          this.config.gitlab.projectId = this.projectId
        }

        core.info(`\x1b[32m✓ Project ID retrieved: ${this.projectId}\x1b[0m`)
      }

      return this.projectId
    } catch (error) {
      core.error('Failed to retrieve GitLab project ID')
      core.error(`Project path: ${projectPath}`)
      core.error(
        `Error details: ${error instanceof Error ? error.message : String(error)}`
      )

      throw new Error(`${ErrorCodes.EGLAB}: Unable to fetch project details. Please verify:
        1. The project path "${projectPath}" is correct
        2. The GitLab token has sufficient permissions
        3. The project exists and is accessible`)
    }
  }

  /**
   * Validate access and permissions for the GitLab project
   */
  async validateAccess(): Promise<void> {
    try {
      core.startGroup('GitLab Access Validation')

      // First, get the project ID
      const projectId = await this.getProjectId()
      core.info(
        `\x1b[32m✓ Validating access using Project ID: ${projectId}\x1b[0m`
      )

      // Define permission checks specific to GitLab
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

      // Validate repository access and permissions
      await this.validatePermissions(
        'gitlab',
        this.config.gitlab.sync,
        permissionChecks
      )

      core.info(
        `\x1b[32m✓ GitLab Project Access Verified: ${this.repo.owner}/${this.repo.repo}; Project ID: ${projectId}\x1b[0m`
      )

      core.endGroup()
    } catch (error) {
      core.error('GitLab access validation failed')
      throw new Error(
        `${ErrorCodes.EGLAB}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Get repository information
   * @returns Repository details including URL
   */
  getRepoInfo() {
    return {
      ...this.repo,
      url: `${this.config.gitlab.url || 'https://gitlab.com'}/${this.repo.owner}/${this.repo.repo}`
    }
  }

  // Delegate to branch helper
  async syncBranches() {
    return this.branches.sync()
  }

  async createBranch(name: string, commitSha: string) {
    return this.branches.create(name, commitSha)
  }

  async updateBranch(name: string, commitSha: string) {
    return this.branches.update(name, commitSha)
  }

  // Delegate to pull request helper
  async syncPullRequests() {
    return this.pullRequest.syncPullRequests()
  }

  async createPullRequest(pr: any) {
    return this.pullRequest.createPullRequest(pr)
  }

  async updatePullRequest(number: number, pr: any) {
    return this.pullRequest.updatePullRequest(number, pr)
  }

  async closePullRequest(number: number) {
    return this.pullRequest.closePullRequest(number)
  }

  // Delegate to issue helper
  async syncIssues() {
    return this.issues.syncIssues()
  }

  async getIssueComments(issueNumber: number) {
    return this.issues.getIssueComments(issueNumber)
  }

  async createIssue(issue: any) {
    return this.issues.createIssue(issue)
  }

  async updateIssue(issueNumber: number, issue: any) {
    return this.issues.updateIssue(issueNumber, issue)
  }

  async createIssueComment(issueNumber: number, comment: any) {
    return this.issues.createIssueComment(issueNumber, comment)
  }

  // Delegate to release helper
  async syncReleases() {
    return this.release.syncReleases()
  }

  async createRelease(release: any) {
    return this.release.createRelease(release)
  }

  async updateRelease(release: any) {
    return this.release.updateRelease(release)
  }

  async downloadReleaseAsset(releaseId: string, asset: any) {
    return this.release.downloadReleaseAsset(releaseId, asset)
  }

  async uploadReleaseAsset(releaseId: string, asset: any) {
    return this.release.uploadReleaseAsset(releaseId, asset)
  }

  // Delegate to tag helper
  async syncTags() {
    return this.tags.syncTags()
  }

  async createTag(tag: any) {
    return this.tags.createTag(tag)
  }

  async updateTag(tag: any) {
    return this.tags.updateTag(tag)
  }
}
