import * as core from '@actions/core'
import { Gitlab } from '@gitbeaker/rest'
import { Repository, Config, IClient, BranchFilterOptions } from '../../types'
import {
  gitlabBranchHelper,
  gitlabIssueHelper,
  mergeRequestHelper,
  gitlabReleaseHelper,
  gitlabTagHelper,
  gitlabPermsHelper
} from './helpers'
import { ErrorCodes } from '@/src/utils/errorCodes'

export class GitLabClient implements IClient {
  public config: Config
  public repo: Repository
  private gitlab
  public branches: gitlabBranchHelper
  public issues: gitlabIssueHelper
  public mergeRequest: mergeRequestHelper
  public release: gitlabReleaseHelper
  public tags: gitlabTagHelper
  private projectId: number | null = null
  private perms: gitlabPermsHelper

  constructor(config: Config, repo: Repository) {
    this.config = config
    this.repo = repo
    if (!config.gitlab?.token) {
      throw new Error(`${ErrorCodes.EGLAB}: GitLab token is required`)
    }

    const host = this.formatHostUrl(config.gitlab.host || 'gitlab.com')
    core.info(`Initializing GitLab client for host: ${host}`)

    this.gitlab = new Gitlab({
      token: config.gitlab.token,
      host
    })

    // Initialize helpers with a method to get projectId
    this.branches = new gitlabBranchHelper(this.gitlab, this.config, () =>
      this.getProjectId()
    )
    this.issues = new gitlabIssueHelper(this.gitlab, this.config, () =>
      this.getProjectId()
    )
    this.mergeRequest = new mergeRequestHelper(this.gitlab, this.config, () =>
      this.getProjectId()
    )
    this.perms = new gitlabPermsHelper(
      this.gitlab,
      this.repo,
      this.config,
      () => this.getProjectId()
    )
    this.release = new gitlabReleaseHelper(this.gitlab, this.config, () =>
      this.getProjectId()
    )
    this.tags = new gitlabTagHelper(this.gitlab, this.config, () =>
      this.getProjectId()
    )
    this.projectId = config.gitlab.projectId || null

    core.info(`\x1b[32m✓ GitLab client initialized successfully\x1b[0m`)
  }

  private formatHostUrl(host: string): string {
    host = host.replace(/\/+$/, '')
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = `https://${host}`
    }
    return host
  }

  private async getProjectId(): Promise<number> {
    if (this.projectId) {
      return this.projectId
    }

    try {
      if (this.config.gitlab?.projectId) {
        this.projectId = this.config.gitlab.projectId
        return this.projectId
      }

      const path = `${this.repo.owner}/${this.repo.repo}`
      core.info(`Fetching project ID for: ${path}`)
      const project = await this.gitlab.Projects.show(path)

      if (!project?.id) {
        throw new Error('Project ID not found in response')
      }

      this.projectId = project.id
      core.info(`Project ID retrieved: ${this.projectId}`)
      return this.projectId
    } catch (error) {
      throw new Error(
        `Failed to fetch project ID for ${this.repo.owner}/${this.repo.repo}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
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
      url: `${this.config.gitlab.host || 'https://gitlab.com'}/${this.repo.owner}/${this.repo.repo}`
    }
  }

  async validateAccess(): Promise<void> {
    return this.perms.validateAccess()
  }

  // Delegate to branch helper
  async fetchBranches(filterOptions?: BranchFilterOptions) {
    return this.branches.fetch(filterOptions)
  }

  async createBranch(name: string, commitSha: string) {
    return this.branches.create(name, commitSha)
  }

  async updateBranch(name: string, commitSha: string) {
    return this.branches.update(name, commitSha)
  }

  // Delegate to pull request helper
  async syncPullRequests() {
    return this.mergeRequest.syncPullRequests()
  }

  async createPullRequest(pr: any) {
    return this.mergeRequest.createPullRequest(pr)
  }

  async updatePullRequest(number: number, pr: any) {
    return this.mergeRequest.updatePullRequest(number, pr)
  }

  async closePullRequest(number: number) {
    return this.mergeRequest.closePullRequest(number)
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
