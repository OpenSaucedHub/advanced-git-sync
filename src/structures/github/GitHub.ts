// src/structures/github/GitHub.ts
import * as github from '@actions/github'
import * as core from '@actions/core'
import {
  Repository,
  Config,
  Issue,
  PullRequest,
  Release,
  ReleaseAsset,
  Tag,
  IClient,
  BranchFilterOptions
} from '@/src/types'
import {
  githubBranchHelper,
  pullRequestHelper,
  githubIssueHelper,
  githubReleaseHelper,
  tagsHelper,
  githubPermsHelper
} from './helpers'

export class GitHubClient implements IClient {
  public config: Config
  public repo: Repository
  private octokit
  public branches: githubBranchHelper
  public pullRequest: pullRequestHelper
  public issue: githubIssueHelper
  public release: githubReleaseHelper
  public tags: tagsHelper
  public perms: githubPermsHelper

  constructor(config: Config, repo: Repository) {
    this.config = config
    this.repo = repo
    this.octokit = github.getOctokit(config.github.token!)
    this.branches = new githubBranchHelper(this.octokit, this.repo, this.config)
    this.pullRequest = new pullRequestHelper(
      this.octokit,
      this.repo,
      this.config
    )
    this.issue = new githubIssueHelper(this.octokit, this.repo, this.config)
    this.release = new githubReleaseHelper(this.octokit, this.repo, this.config)
    this.tags = new tagsHelper(this.octokit, this.repo, this.config)
    this.perms = new githubPermsHelper(this.octokit, this.repo, this.config)
    core.info(
      `\x1b[32m✓ GitHub Client Initialized: ${repo.owner}/${repo.repo}\x1b[0m`
    )
  }

  getRepoInfo() {
    return {
      ...this.repo,
      url: `https://github.com/${this.repo.owner}/${this.repo.repo}`
    }
  }
  async validateAccess(): Promise<void> {
    return this.perms.validateAccess()
  }

  // Delegate branch operations to ghBranchHelper
  async fetchBranches(filterOptions?: BranchFilterOptions) {
    return this.branches.fetch(filterOptions)
  }

  async createBranch(name: string, commitSha: string) {
    return this.branches.create(name, commitSha)
  }

  async updateBranch(name: string, commitSha: string) {
    return this.branches.update(name, commitSha)
  }

  async commitExists(commitSha: string): Promise<boolean> {
    try {
      await this.octokit.rest.git.getCommit({
        ...this.repo,
        commit_sha: commitSha
      })
      return true
    } catch (error) {
      return false
    }
  }

  async getRecentCommits(branchName: string, limit: number): Promise<any[]> {
    try {
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        ...this.repo,
        sha: branchName,
        per_page: limit
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
      const { data: commit } = await this.octokit.rest.git.getCommit({
        ...this.repo,
        commit_sha: commitSha
      })
      return {
        sha: commitSha,
        date: commit.author.date
      }
    } catch (error) {
      core.debug(`Failed to get commit details for ${commitSha}: ${error}`)
      return null
    }
  }

  async syncPullRequests(): Promise<PullRequest[]> {
    return this.pullRequest.syncPullRequests()
  }

  async createPullRequest(pr: PullRequest): Promise<void> {
    return this.pullRequest.createPullRequest(pr)
  }

  async updatePullRequest(number: number, pr: PullRequest): Promise<void> {
    return this.pullRequest.updatePullRequest(number, pr)
  }

  async closePullRequest(number: number): Promise<void> {
    return this.pullRequest.closePullRequest(number)
  }

  // sync issues
  async syncIssues(): Promise<Issue[]> {
    return this.issue.syncIssues()
  }

  async createIssue(issue: Issue): Promise<void> {
    return this.issue.createIssue(issue)
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    return this.issue.updateIssue(issueNumber, issue)
  }

  // releases

  async syncReleases(): Promise<Release[]> {
    return this.release.syncReleases()
  }

  async createRelease(release: Release): Promise<void> {
    return this.release.createRelease(release)
  }

  async updateRelease(release: Release): Promise<void> {
    return this.release.updateRelease(release)
  }

  async downloadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<Buffer> {
    return this.release.downloadReleaseAsset(releaseId, asset)
  }

  async uploadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset,
    content: Buffer
  ): Promise<void> {
    return this.release.uploadReleaseAsset(releaseId, asset, content)
  }

  // tags
  async syncTags(): Promise<Tag[]> {
    return this.tags.syncTags()
  }

  async createTag(tag: Tag): Promise<void> {
    return this.tags.createTag(tag)
  }

  async updateTag(tag: Tag): Promise<void> {
    return this.tags.updateTag(tag)
  }

  /**
   * Create a new repository if it doesn't exist
   * @returns true if repository was created, false if it already existed
   */
  async createRepositoryIfNotExists(): Promise<boolean> {
    try {
      // First check if repository already exists
      await this.octokit.rest.repos.get({ ...this.repo })
      core.info(
        `Repository ${this.repo.owner}/${this.repo.repo} already exists`
      )
      return false
    } catch (error: any) {
      if (error.status === 404) {
        // Repository doesn't exist, create it
        core.info(`Creating repository ${this.repo.owner}/${this.repo.repo}`)

        try {
          await this.octokit.rest.repos.createForAuthenticatedUser({
            name: this.repo.repo,
            private: true, // Default to private for security
            auto_init: true, // Initialize with README
            description: `Repository automatically created by advanced-git-sync from ${this.repo.owner}/${this.repo.repo}`
          })

          core.info(
            `✓ Successfully created repository ${this.repo.owner}/${this.repo.repo}`
          )
          return true
        } catch (createError: any) {
          // If creation fails, check if it's because we need to create in an organization
          if (
            createError.status === 422 &&
            this.repo.owner !==
              (await this.octokit.rest.users.getAuthenticated()).data.login
          ) {
            // Try creating in organization
            try {
              await this.octokit.rest.repos.createInOrg({
                org: this.repo.owner,
                name: this.repo.repo,
                private: true,
                auto_init: true,
                description: `Repository automatically created by advanced-git-sync`
              })

              core.info(
                `✓ Successfully created repository ${this.repo.owner}/${this.repo.repo} in organization`
              )
              return true
            } catch (orgError: any) {
              throw new Error(
                `Failed to create repository in organization ${this.repo.owner}: ${orgError.message}`
              )
            }
          }
          throw createError
        }
      } else {
        // Some other error occurred (not 404)
        throw error
      }
    }
  }
}
