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

  constructor(config: Config, repo?: Repository) {
    super(config, repo || { owner: '', repo: '' })
    this.gitlab = new Gitlab({
      token: config.gitlab.token,
      host: config.gitlab.url || 'https://gitlab.com'
    })

    this.branches = new BranchHelper(this.gitlab, this.repo, this.config)
    this.issues = new IssueHelper(this.gitlab, this.repo, this.config)
    this.pullRequest = new PullRequestHelper(
      this.gitlab,
      this.repo,
      this.config
    )
    this.release = new ReleaseHelper(this.gitlab, this.repo, this.config)
    this.tags = new TagHelper(this.gitlab, this.repo, this.config)

    core.info(
      `\x1b[32m✓ GitLab Client Initialized: ${this.repo.owner}/${this.repo.repo}\x1b[0m`
    )
  }

  getRepoInfo() {
    return {
      owner: this.repo.owner,
      repo: this.repo.repo,
      url: `${this.config.gitlab.url || 'https://gitlab.com'}/${this.repo.owner}/${this.repo.repo}`
    }
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
