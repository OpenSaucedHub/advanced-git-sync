// src/gitlab.ts

import * as core from '@actions/core'
import { Gitlab } from '@gitbeaker/rest'
import { Config } from './types'
import {
  Repository,
  Branch,
  PullRequest,
  Issue,
  Release,
  Comment
} from './types'
import { getGitLabRepo } from './utils/repository'

export class GitLabClient {
  private gitlab
  private config: Config
  private repo: Repository

  constructor(config: Config) {
    this.config = config
    this.gitlab = new Gitlab({
      token: config.gitlab.token,
      host: config.gitlab.url || 'https://gitlab.com'
    })
    this.repo = getGitLabRepo(config)
  }

  private get projectPath(): string {
    return `${this.repo.owner}/${this.repo.repo}`
  }

  async syncBranches(): Promise<Branch[]> {
    if (!this.config.github.sync?.branches.enabled) return []

    try {
      const branches = await this.gitlab.Branches.all(this.projectPath)
      return branches.map(branch => ({
        name: branch.name,
        sha: branch.commit.id,
        protected: branch.protected
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitLab branches: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.github.sync?.pullRequests.enabled) return []

    try {
      const mrs = await this.gitlab.MergeRequests.all({
        projectId: this.projectPath,
        state: 'opened'
      })

      return mrs.map(mr => ({
        title: mr.title,
        description: mr.description || '',
        sourceBranch: mr.source_branch,
        targetBranch: mr.target_branch,
        labels: [
          ...(mr.labels || []),
          ...(this.config.github.sync?.pullRequests.labels || [])
        ]
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitLab merge requests: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncIssues(): Promise<Issue[]> {
    if (!this.config.github.sync?.issues.enabled) return []

    try {
      const issues = await this.gitlab.Issues.all({
        projectId: this.projectPath
      })

      return issues.map(issue => ({
        title: issue.title,
        body: issue.description || '',
        labels: [
          ...(issue.labels || []),
          ...(this.config.github.sync?.issues.labels ?? [])
        ],
        number: issue.iid,
        state: issue.state === 'opened' ? 'open' : 'closed'
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitLab issues: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async getIssueComments(issueNumber: number): Promise<Comment[]> {
    if (!this.config.github.sync?.issues.syncComments) return []

    try {
      const notes = await this.gitlab.IssueNotes.all(
        this.projectPath,
        issueNumber
      )
      return notes.map(note => ({
        body: note.body,
        createdAt: note.created_at,
        author: note.author.username
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitLab issue comments: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncReleases(): Promise<Release[]> {
    if (!this.config.github.sync?.releases.enabled) return []

    try {
      const releases = await this.gitlab.ProjectReleases.all(this.projectPath)
      return releases.map(release => ({
        tag: release.tag_name,
        name: release.name || release.tag_name,
        body: release.description || '',
        draft: false, // GitLab doesn't have draft releases
        prerelease: false // GitLab doesn't have pre-releases
      }))
    } catch (error) {
      core.warning(
        `Failed to fetch GitLab releases: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async syncTags(): Promise<string[]> {
    if (!this.config.github.sync?.tags.enabled) return []

    try {
      const tags = await this.gitlab.Tags.all(this.projectPath)
      return tags.map(tag => tag.name)
    } catch (error) {
      core.warning(
        `Failed to fetch GitLab tags: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }
}
