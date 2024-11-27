// src/github.ts
import * as github from '@actions/github'
import * as core from '@actions/core'
import { Config } from './types'
import {
  Repository,
  Branch,
  PullRequest,
  Issue,
  Release,
  Comment
} from './types'
import { getGitHubRepo } from './utils/repository'

export class GitHubClient {
  private octokit
  private config: Config
  private repo: Repository

  constructor(config: Config) {
    this.config = config

    if (!config.github.token) {
      throw new Error('GitHub token is required')
    }

    this.octokit = github.getOctokit(config.github.token!)
    this.repo = getGitHubRepo(config)
  }

  async syncBranches(): Promise<Branch[]> {
    if (!this.config.gitlab.sync?.branches.enabled) return []

    try {
      const { data: branches } = await this.octokit.rest.repos.listBranches({
        ...this.repo,
        protected: this.config.gitlab.sync?.branches.protected
      })

      return branches.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitHub branches: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.gitlab.sync?.pullRequests.enabled) return []

    try {
      const { data: prs } = await this.octokit.rest.pulls.list({
        ...this.repo,
        state: 'open'
      })

      return prs.map(pr => ({
        title: pr.title,
        description: pr.body || '',
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref,
        labels: this.config.gitlab.sync?.pullRequests.labels ?? []
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitHub pull requests: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncIssues(): Promise<Issue[]> {
    if (!this.config.gitlab.sync?.issues.enabled) return []

    try {
      const { data: issues } = await this.octokit.rest.issues.list({
        ...this.repo,
        state: 'all'
      })

      return issues.map(issue => ({
        title: issue.title,
        body: issue.body || '',
        labels: [
          ...(issue.labels as string[]),
          ...(this.config.gitlab.sync?.issues.labels ?? [])
        ],
        number: issue.number,
        state: issue.state as 'open' | 'closed'
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitHub issues: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async getIssueComments(issueNumber: number): Promise<Comment[]> {
    if (!this.config.gitlab.sync?.issues.syncComments) return []

    try {
      const { data: comments } = await this.octokit.rest.issues.listComments({
        ...this.repo,
        issue_number: issueNumber
      })

      return comments.map(comment => ({
        body: comment.body || '',
        createdAt: comment.created_at,
        author: comment.user?.login || 'unknown'
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitHub issue comments: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncReleases(): Promise<Release[]> {
    if (!this.config.gitlab.sync?.releases.enabled) return []

    try {
      const { data: releases } = await this.octokit.rest.repos.listReleases({
        ...this.repo
      })

      return releases.map(release => ({
        tag: release.tag_name,
        name: release.name || '',
        body: release.body || '',
        draft: release.draft,
        prerelease: release.prerelease
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitHub releases: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncTags(): Promise<string[]> {
    if (!this.config.gitlab.sync?.tags.enabled) return []

    try {
      const { data: tags } = await this.octokit.rest.repos.listTags({
        ...this.repo
      })

      return tags.map(tag => tag.name)
    } catch (error) {
      core.warning(
        `Failed to fetch GitHub tags: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }
}
