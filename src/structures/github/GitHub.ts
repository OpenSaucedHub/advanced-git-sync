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
  Tag
} from '@/src/types'
import { BaseClient } from '../baseClient'
import {
  branchHelper,
  permHelper,
  pullRequestHelper,
  issueHelper,
  releaseHelper,
  tagsHelper
} from './helpers'

export class GitHubClient extends BaseClient {
  private octokit
  public branches: branchHelper
  public permissions: permHelper
  public pullRequest: pullRequestHelper
  public issue: issueHelper
  public release: releaseHelper
  public tags: tagsHelper

  constructor(config: Config, repo?: Repository) {
    super(config, repo || { owner: '', repo: '' })
    this.octokit = github.getOctokit(config.github.token!)
    this.permissions = new permHelper(this.octokit, this.repo, this.config)
    this.branches = new branchHelper(this.octokit, this.repo, this.config)
    this.pullRequest = new pullRequestHelper(
      this.octokit,
      this.repo,
      this.config
    )
    this.issue = new issueHelper(this.octokit, this.repo, this.config)
    this.release = new releaseHelper(this.octokit, this.repo, this.config)
    this.tags = new tagsHelper(this.octokit, this.repo, this.config)

    core.info(
      `\x1b[32m✓ GitHub Client Initialized: ${this.repo.owner}/${this.repo.repo}\x1b[0m`
    )
  }

  getRepoInfo() {
    return {
      owner: this.repo.owner,
      repo: this.repo.repo,
      url: `https://github.com/${this.repo.owner}/${this.repo.repo}`
    }
  }

  async validateAccess(): Promise<void> {
    return this.permissions.validateAccess()
  }

  // Delegate branch operations to branchHelper
  async syncBranches() {
    return this.branches.sync()
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
