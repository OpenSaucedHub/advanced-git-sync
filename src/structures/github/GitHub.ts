// src/structures/github/GitHub.ts
import * as github from '@actions/github'
import * as core from '@actions/core'
import {
  Repository,
  Config,
  Issue,
  Comment,
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
  async getIssueComments(issueNumber: number): Promise<Comment[]> {
    return this.issue.getIssueComments(issueNumber)
  }

  async createIssue(issue: Issue): Promise<void> {
    return this.issue.createIssue(issue)
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    return this.issue.updateIssue(issueNumber, issue)
  }

  async createIssueComment(
    issueNumber: number,
    comment: Comment
  ): Promise<void> {
    return this.issue.createIssueComment(issueNumber, comment)
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
