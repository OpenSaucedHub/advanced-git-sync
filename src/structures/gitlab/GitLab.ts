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

  async deleteBranch(name: string) {
    return this.branches.delete(name)
  }

  async commitExists(commitSha: string): Promise<boolean> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.Commits.show(projectId, commitSha)
      return true
    } catch (error) {
      return false
    }
  }

  async getRecentCommits(branchName: string, limit: number): Promise<any[]> {
    try {
      const projectId = await this.getProjectId()
      const commits = await this.gitlab.Commits.all(projectId, {
        refName: branchName,
        perPage: limit
      })
      return commits
    } catch (error) {
      throw new Error(`Failed to get recent commits: ${error}`)
    }
  }

  async getCommitDetails(
    commitSha: string
  ): Promise<{ sha: string; date: string } | null> {
    try {
      const projectId = await this.getProjectId()
      const commit = await this.gitlab.Commits.show(projectId, commitSha)
      return {
        sha: commitSha,
        date: commit.created_at
      }
    } catch (error) {
      core.debug(`Failed to get commit details for ${commitSha}: ${error}`)
      return null
    }
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

  async createIssue(issue: any) {
    return this.issues.createIssue(issue)
  }

  async updateIssue(issueNumber: number, issue: any) {
    return this.issues.updateIssue(issueNumber, issue)
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

  /**
   * Create a new project if it doesn't exist
   * @returns true if project was created, false if it already existed
   */
  async createRepositoryIfNotExists(): Promise<boolean> {
    try {
      // First check if project already exists
      if (this.config.gitlab?.projectId) {
        // If projectId is provided, check if it exists
        await this.gitlab.Projects.show(this.config.gitlab.projectId)
        core.info(
          `GitLab project with ID ${this.config.gitlab.projectId} already exists`
        )
        return false
      } else {
        // Check by path
        const path = `${this.repo.owner}/${this.repo.repo}`
        await this.gitlab.Projects.show(path)
        core.info(`GitLab project ${path} already exists`)
        return false
      }
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('404')) {
        // Project doesn't exist, create it
        const projectName = this.repo.repo
        const namespacePath = this.repo.owner

        core.info(`Creating GitLab project ${namespacePath}/${projectName}`)

        try {
          // First, try to get the namespace (user or group) ID
          let namespaceId: number | undefined

          try {
            const namespaces = await this.gitlab.Namespaces.all({
              search: namespacePath
            })
            const namespace = namespaces.find(
              (ns: any) =>
                ns.path === namespacePath || ns.full_path === namespacePath
            )
            if (namespace) {
              namespaceId = namespace.id
            }
          } catch (namespaceError) {
            core.warning(
              `Could not find namespace ${namespacePath}, creating in personal namespace`
            )
          }

          const createParams: any = {
            name: projectName,
            path: projectName,
            visibility: 'private', // Default to private for security
            initialize_with_readme: true,
            description: `Project automatically created by advanced-git-sync`
          }

          if (namespaceId) {
            createParams.namespace_id = namespaceId
          }

          const project = await this.gitlab.Projects.create(createParams)

          if (project?.id) {
            this.projectId = project.id
            core.info(
              `✓ Successfully created GitLab project ${namespacePath}/${projectName} with ID: ${project.id}`
            )
            return true
          } else {
            throw new Error('Project creation returned invalid response')
          }
        } catch (createError: any) {
          throw new Error(
            `Failed to create GitLab project ${namespacePath}/${projectName}: ${createError.message}`
          )
        }
      } else {
        // Some other error occurred (not 404)
        throw error
      }
    }
  }
}
