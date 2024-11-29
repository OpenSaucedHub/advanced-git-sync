// src/gitlab.ts

import * as core from '@actions/core'
import { Gitlab } from '@gitbeaker/rest'
import {
  Repository,
  Config,
  ReleaseAsset,
  Tag,
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
    return `${this.repo.owner}/${this.repo.repo}`
  }

  async syncBranches(): Promise<Branch[]> {
    if (!this.config.github.sync?.branches.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🌿 Fetching GitLab Branches...\x1b[0m')

      const branches = await this.gitlab.Branches.all(this.projectPath)
      const processedBranches = branches.map(branch => ({
        name: branch.name,
        sha: branch.commit.id,
        protected: branch.protected
      }))

      core.info(
        `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches\x1b[0m`
      )
      return processedBranches
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Branches: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createBranch(name: string, commitSha: string): Promise<void> {
    try {
      await this.gitlab.Branches.create(this.projectPath, name, commitSha)
    } catch (error) {
      throw new Error(
        `Failed to create branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async updateBranch(name: string, commitSha: string): Promise<void> {
    try {
      // GitLab API doesn't have a direct "update branch" endpoint
      // We need to delete and recreate the branch
      await this.gitlab.Branches.remove(this.projectPath, name)
      await this.gitlab.Branches.create(this.projectPath, name, commitSha)
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.github.sync?.pullRequests.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🔀 Fetching GitLab Merge Requests...\x1b[0m')

      const mrs = await this.gitlab.MergeRequests.all({
        projectId: this.projectPath,
        scope: 'all' // Use scope instead of state to get all MRs
      })

      const processedPRs = await Promise.all(
        mrs.map(async mr => {
          // Fetch comments (notes in GitLab)
          const comments = await this.gitlab.MergeRequestNotes.all(
            this.projectPath,
            mr.iid
          )

          return {
            id: mr.id,
            number: mr.iid,
            title: mr.title,
            description: mr.description || '',
            sourceBranch: mr.source_branch,
            targetBranch: mr.target_branch,
            labels: [
              ...(mr.labels || []),
              ...(this.config.github.sync?.pullRequests.labels || [])
            ],
            state: (mr.state === 'merged'
              ? 'merged'
              : mr.state === 'opened'
                ? 'open'
                : 'closed') as 'merged' | 'open' | 'closed',
            comments: comments.map(comment => ({
              id: comment.id,
              body: comment.body || '',
              author: comment.author.username,
              createdAt: comment.created_at
            }))
          }
        })
      )

      core.info(
        `\x1b[32m✓ Merge Requests Fetched: ${processedPRs.length} MRs\x1b[0m`
      )
      return processedPRs
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Merge Requests: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createPullRequest(pr: PullRequest): Promise<void> {
    try {
      const mr = await this.gitlab.MergeRequests.create(
        this.projectPath,
        pr.sourceBranch,
        pr.targetBranch,
        pr.title,
        {
          description: pr.description,
          labels: pr.labels.join(',')
        }
      )

      // Sync comments
      if (pr.comments) {
        for (const comment of pr.comments) {
          await this.gitlab.MergeRequestNotes.create(
            this.projectPath,
            mr.iid,
            comment.body
          )
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to create MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updatePullRequest(number: number, pr: PullRequest): Promise<void> {
    try {
      await this.gitlab.MergeRequests.edit(this.projectPath, number, {
        title: pr.title,
        description: pr.description,
        stateEvent: pr.state === 'closed' ? 'close' : 'reopen',
        labels: pr.labels.join(',')
      })
    } catch (error) {
      throw new Error(
        `Failed to update MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async closePullRequest(number: number): Promise<void> {
    try {
      await this.gitlab.MergeRequests.edit(this.projectPath, number, {
        stateEvent: 'close'
      })
    } catch (error) {
      throw new Error(
        `Failed to close MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async syncIssues(): Promise<Issue[]> {
    if (!this.config.github.sync?.issues.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m❗ Fetching GitLab Issues...\x1b[0m')

      const issues = await this.gitlab.Issues.all({
        projectId: this.projectPath,
        state: 'all'
      })

      const processedIssues = issues.map(issue => ({
        title: issue.title,
        body: issue.description || '',
        labels: [
          ...(issue.labels || []),
          ...(this.config.github.sync?.issues.labels ?? [])
        ],
        number: issue.iid,
        state: (issue.state === 'opened' ? 'open' : 'closed') as
          | 'open'
          | 'closed'
      }))

      core.info(
        `\x1b[32m✓ Issues Fetched: ${processedIssues.length} total issues\x1b[0m`
      )
      return processedIssues
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Issues: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }
  async getIssueComments(issueNumber: number): Promise<Comment[]> {
    if (!this.config.github.sync?.issues.syncComments) {
      return []
    }

    try {
      core.info(
        `\x1b[36m💬 Fetching Comments for Issue #${issueNumber}...\x1b[0m`
      )

      const notes = await this.gitlab.IssueNotes.all(
        this.projectPath,
        issueNumber
      )

      const processedComments = notes.map(note => ({
        id: note.id,
        body: note.body,
        createdAt: note.created_at,
        author: note.author.username
      }))

      core.info(
        `\x1b[32m✓ Comments Fetched: ${processedComments.length} comments\x1b[0m`
      )
      return processedComments
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Issue Comments: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createIssue(issue: Issue): Promise<void> {
    try {
      await this.gitlab.Issues.create(this.projectPath, issue.title, {
        description: issue.body,
        labels: issue.labels.join(',')
      })
    } catch (error) {
      throw new Error(
        `Failed to create issue "${issue.title}": ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    try {
      await this.gitlab.Issues.edit(this.projectPath, issueNumber, {
        title: issue.title,
        description: issue.body,
        labels: issue.labels.join(','),
        stateEvent: issue.state === 'closed' ? 'close' : 'reopen'
      })
    } catch (error) {
      throw new Error(
        `Failed to update issue #${issueNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async createIssueComment(
    issueNumber: number,
    comment: Comment
  ): Promise<void> {
    try {
      await this.gitlab.IssueNotes.create(
        this.projectPath,
        issueNumber,
        comment.body
      )
    } catch (error) {
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async syncReleases(): Promise<Release[]> {
    if (!this.config.github.sync?.releases.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷️ Fetching GitLab Releases...\x1b[0m')

      const releases = await this.gitlab.ProjectReleases.all(this.projectPath)
      const processedReleases = releases.map(release => ({
        id: release.tag_name, // GitLab uses tag name as release identifier
        tag: release.tag_name,
        name: release.name || release.tag_name,
        body: release.description || '',
        draft: false, // GitLab doesn't support draft releases
        prerelease: false, // GitLab doesn't support prereleases
        createdAt: release.created_at,
        publishedAt: release.released_at,
        assets: (release.assets.links ?? []).map(asset => ({
          name: asset.name,
          url: asset.url,
          size: 0, // GitLab API doesn't provide size information
          contentType: asset.link_type || 'application/octet-stream'
        }))
      }))

      core.info(
        `\x1b[32m✓ Releases Fetched: ${processedReleases.length} releases\x1b[0m`
      )
      return processedReleases
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Releases: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createRelease(release: Release): Promise<void> {
    try {
      const createdRelease = await this.gitlab.ProjectReleases.create(
        this.projectPath,
        {
          tag_name: release.tag,
          name: release.name,
          description: release.body,
          ref: release.tag // Use tag as reference
        }
      )

      // Store the created release ID (tag name in GitLab)
      release.id = createdRelease.tag_name
    } catch (error) {
      throw new Error(
        `Failed to create release ${release.tag}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async updateRelease(release: Release): Promise<void> {
    try {
      await this.gitlab.ProjectReleases.edit(this.projectPath, release.tag, {
        name: release.name,
        description: release.body
      })
    } catch (error) {
      throw new Error(
        `Failed to update release ${release.tag}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async downloadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<Buffer> {
    try {
      const response = await fetch(asset.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      throw new Error(
        `Failed to download asset ${asset.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async uploadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<void> {
    try {
      await this.gitlab.ReleaseLinks.create(
        this.projectPath,
        releaseId, // tag name in GitLab
        asset.name,
        asset.url,
        {
          linkType: asset.contentType
        }
      )
    } catch (error) {
      throw new Error(
        `Failed to upload asset ${asset.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async syncTags(): Promise<Tag[]> {
    if (!this.config.github.sync?.tags.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷 Fetching GitLab Tags...\x1b[0m')

      const tags = await this.gitlab.Tags.all(this.projectPath)
      const processedTags = tags.map(tag => ({
        name: tag.name,
        createdAt: tag.commit.created_at,
        commitSha: tag.commit.id
      }))

      core.info(`\x1b[32m✓ Tags Fetched: ${processedTags.length} tags\x1b[0m`)
      return processedTags
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Tags: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createTag(tag: Tag): Promise<void> {
    try {
      await this.gitlab.Tags.create(this.projectPath, tag.name, tag.commitSha)
    } catch (error) {
      throw new Error(
        `Failed to create tag ${tag.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async updateTag(tag: Tag): Promise<void> {
    try {
      // Delete existing tag
      await this.gitlab.Tags.remove(this.projectPath, tag.name)

      // Create new tag
      await this.createTag(tag)
    } catch (error) {
      throw new Error(
        `Failed to update tag ${tag.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
