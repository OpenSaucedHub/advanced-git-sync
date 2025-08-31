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

  async getRepoInfo() {
    const description = await this.getRepositoryDescription()
    return {
      ...this.repo,
      description,
      url: `https://github.com/${this.repo.owner}/${this.repo.repo}`
    }
  }

  async getRepositoryDescription(): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.repo.owner,
        repo: this.repo.repo
      })
      return data.description || null
    } catch {
      return null
    }
  }

  async updateRepositoryDescription(description: string): Promise<void> {
    try {
      await this.octokit.rest.repos.update({
        owner: this.repo.owner,
        repo: this.repo.repo,
        description
      })
    } catch {
      // Silent failure - description sync is not critical
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
}
