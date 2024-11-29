// src/github.ts
import * as github from '@actions/github'
import * as core from '@actions/core'
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
import { getGitHubRepo } from './utils/repository'

export class GitHubClient {
  private octokit
  private config: Config
  private repo: Repository

  constructor(config: Config) {
    this.config = config

    if (!config.github.token) {
      core.info('\x1b[31m❌ GitHub Authentication Error\x1b[0m')
      throw new Error('GitHub token is required')
    }

    this.octokit = github.getOctokit(config.github.token!)
    this.repo = getGitHubRepo(config)

    core.info(
      `\x1b[32m✅ GitHub Client Initialized: ${this.repo.owner}/${this.repo.repo}\x1b[0m`
    )
  }

  // sync branches
  async syncBranches(): Promise<Branch[]> {
    if (!this.config.gitlab.sync?.branches.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🌿 Fetching GitHub Branches...\x1b[0m')

      const { data: branches } = await this.octokit.rest.repos.listBranches({
        ...this.repo,
        protected: this.config.gitlab.sync?.branches.protected
      })

      const processedBranches = branches.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected
      }))

      core.info(
        `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches\x1b[0m`
      )
      return processedBranches
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Branches: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createBranch(name: string, commitSha: string): Promise<void> {
    try {
      await this.octokit.rest.git.createRef({
        ...this.repo,
        ref: `refs/heads/${name}`,
        sha: commitSha
      })
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
      await this.octokit.rest.git.updateRef({
        ...this.repo,
        ref: `refs/heads/${name}`,
        sha: commitSha,
        force: true
      })
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.gitlab.sync?.pullRequests.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🔀 Fetching GitHub Pull Requests...\x1b[0m')

      const { data: prs } = await this.octokit.rest.pulls.list({
        ...this.repo,
        state: 'all' // Get all PRs including closed/merged
      })

      const processedPRs = await Promise.all(
        prs.map(async pr => {
          // Fetch comments
          const { data: comments } =
            await this.octokit.rest.issues.listComments({
              ...this.repo,
              issue_number: pr.number
            })

          // Fetch reviews
          const { data: reviews } = await this.octokit.rest.pulls.listReviews({
            ...this.repo,
            pull_number: pr.number
          })

          return {
            id: pr.id,
            number: pr.number,
            title: pr.title,
            description: pr.body || '',
            sourceBranch: pr.head.ref,
            targetBranch: pr.base.ref,
            labels: pr.labels.map(label => label.name),
            state: pr.merged_at
              ? 'merged'
              : (pr.state as 'open' | 'closed' | 'merged'),
            comments: comments.map(comment => ({
              id: comment.id,
              body: comment.body || '',
              author: comment.user?.login || '',
              createdAt: comment.created_at
            })),
            reviews: reviews.map(review => ({
              id: review.id,
              state: review.state.toLowerCase() as
                | 'approved'
                | 'changes_requested'
                | 'commented',
              body: review.body || '',
              author: review.user?.login || '',
              createdAt: review.submitted_at || ''
            }))
          }
        })
      )

      core.info(
        `\x1b[32m✓ Pull Requests Fetched: ${processedPRs.length} PRs\x1b[0m`
      )
      return processedPRs
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Pull Requests: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createPullRequest(pr: PullRequest): Promise<void> {
    try {
      const { data: newPR } = await this.octokit.rest.pulls.create({
        ...this.repo,
        title: pr.title,
        body: pr.description,
        head: pr.sourceBranch,
        base: pr.targetBranch
      })

      // Add labels
      if (pr.labels.length > 0) {
        await this.octokit.rest.issues.addLabels({
          ...this.repo,
          issue_number: newPR.number,
          labels: pr.labels
        })
      }

      // Sync comments
      if (pr.comments) {
        for (const comment of pr.comments) {
          await this.octokit.rest.issues.createComment({
            ...this.repo,
            issue_number: newPR.number,
            body: comment.body
          })
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to create PR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updatePullRequest(number: number, pr: PullRequest): Promise<void> {
    try {
      await this.octokit.rest.pulls.update({
        ...this.repo,
        pull_number: number,
        title: pr.title,
        body: pr.description,
        state: pr.state === 'merged' ? 'closed' : pr.state
      })

      // Update labels
      await this.octokit.rest.issues.setLabels({
        ...this.repo,
        issue_number: number,
        labels: pr.labels
      })
    } catch (error) {
      throw new Error(
        `Failed to update PR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async closePullRequest(number: number): Promise<void> {
    try {
      await this.octokit.rest.pulls.update({
        ...this.repo,
        pull_number: number,
        state: 'closed'
      })
    } catch (error) {
      throw new Error(
        `Failed to close PR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // sync issues
  async syncIssues(): Promise<Issue[]> {
    if (!this.config.gitlab.sync?.issues.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m❗ Fetching GitHub Issues...\x1b[0m')

      const { data: issues } = await this.octokit.rest.issues.list({
        ...this.repo,
        state: 'all'
      })

      const processedIssues = issues.map(issue => ({
        title: issue.title,
        body: issue.body || '',
        labels: [
          ...(issue.labels as string[]),
          ...(this.config.gitlab.sync?.issues.labels ?? [])
        ],
        number: issue.number,
        state: issue.state as 'open' | 'closed'
      }))

      core.info(
        `\x1b[32m✓ Issues Fetched: ${processedIssues.length} total issues\x1b[0m`
      )
      return processedIssues
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Issues: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async getIssueComments(issueNumber: number): Promise<Comment[]> {
    if (!this.config.gitlab.sync?.issues.syncComments) {
      core.info('\x1b[33m⚠️ Issue Comments Sync Disabled\x1b[0m')
      return []
    }

    try {
      core.info(
        `\x1b[36m💬 Fetching Comments for Issue #${issueNumber}...\x1b[0m`
      )

      const { data: comments } = await this.octokit.rest.issues.listComments({
        ...this.repo,
        issue_number: issueNumber
      })

      const processedComments = comments.map(comment => ({
        id: comment.id,
        body: comment.body || '',
        createdAt: comment.created_at,
        author: comment.user?.login || 'unknown'
      }))

      core.info(
        `\x1b[32m✓ Comments Fetched: ${processedComments.length} comments\x1b[0m`
      )
      return processedComments
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Issue Comments: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createIssue(issue: Issue): Promise<void> {
    try {
      await this.octokit.rest.issues.create({
        ...this.repo,
        title: issue.title,
        body: issue.body,
        labels: issue.labels
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
      await this.octokit.rest.issues.update({
        ...this.repo,
        issue_number: issueNumber,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        state: issue.state
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
      await this.octokit.rest.issues.createComment({
        ...this.repo,
        issue_number: issueNumber,
        body: comment.body
      })
    } catch (error) {
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async syncReleases(): Promise<Release[]> {
    if (!this.config.gitlab.sync?.releases.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷️ Fetching GitHub Releases...\x1b[0m')

      const { data: releases } = await this.octokit.rest.repos.listReleases({
        ...this.repo
      })

      const processedReleases = releases.map(release => ({
        id: release.id.toString(),
        tag: release.tag_name,
        name: release.name || release.tag_name,
        body: release.body || '',
        draft: release.draft,
        prerelease: release.prerelease,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        assets: release.assets.map(asset => ({
          name: asset.name,
          url: asset.browser_download_url,
          size: asset.size,
          contentType: asset.content_type
        }))
      }))

      core.info(
        `\x1b[32m✓ Releases Fetched: ${processedReleases.length} releases\x1b[0m`
      )
      return processedReleases
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Releases: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createRelease(release: Release): Promise<void> {
    try {
      const { data: createdRelease } =
        await this.octokit.rest.repos.createRelease({
          ...this.repo,
          tag_name: release.tag,
          name: release.name,
          body: release.body,
          draft: release.draft,
          prerelease: release.prerelease
        })

      // Store the created release ID for asset upload
      release.id = createdRelease.id.toString()
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
      const { data: existingRelease } =
        await this.octokit.rest.repos.getReleaseByTag({
          ...this.repo,
          tag: release.tag
        })

      await this.octokit.rest.repos.updateRelease({
        ...this.repo,
        release_id: existingRelease.id,
        tag_name: release.tag,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease
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
      const response = await this.octokit.request(
        'GET /repos/{owner}/{repo}/releases/assets/{asset_id}',
        {
          ...this.repo,
          asset_id: parseInt(releaseId),
          headers: {
            Accept: 'application/octet-stream'
          }
        }
      )

      return Buffer.from(response.data as unknown as Uint8Array)
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
    asset: ReleaseAsset,
    content: Buffer
  ): Promise<void> {
    try {
      await this.octokit.rest.repos.uploadReleaseAsset({
        ...this.repo,
        release_id: parseInt(releaseId),
        name: asset.name,
        data: content.toString('base64'),
        headers: {
          'content-type': asset.contentType,
          'content-length': asset.size
        }
      })
    } catch (error) {
      throw new Error(
        `Failed to upload asset ${asset.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async syncTags(): Promise<Tag[]> {
    if (!this.config.gitlab.sync?.tags.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷 Fetching GitHub Tags...\x1b[0m')

      const { data: tags } = await this.octokit.rest.repos.listTags({
        ...this.repo
      })

      // Get tag creation times from refs
      const processedTags = await Promise.all(
        tags.map(async tag => {
          try {
            const { data: ref } = await this.octokit.rest.git.getRef({
              ...this.repo,
              ref: `tags/${tag.name}`
            })

            const { data: tagData } = await this.octokit.rest.git.getTag({
              ...this.repo,
              tag_sha: ref.object.sha
            })

            return {
              name: tag.name,
              createdAt: tagData.tagger.date,
              commitSha: tag.commit.sha
            }
          } catch (error) {
            core.warning(
              `\x1b[31m❌ Failed to Fetch GitHub Tags creation time: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
            )
            // Fallback to commit date if annotated tag data is not available
            const { data: commit } = await this.octokit.rest.git.getCommit({
              ...this.repo,
              commit_sha: tag.commit.sha
            })

            return {
              name: tag.name,
              createdAt: commit.author.date,
              commitSha: tag.commit.sha
            }
          }
        })
      )

      core.info(`\x1b[32m✓ Tags Fetched: ${processedTags.length} tags\x1b[0m`)
      return processedTags
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Tags: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createTag(tag: Tag): Promise<void> {
    try {
      // Create the tag reference
      await this.octokit.rest.git.createRef({
        ...this.repo,
        ref: `refs/tags/${tag.name}`,
        sha: tag.commitSha
      })
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
      await this.octokit.rest.git.deleteRef({
        ...this.repo,
        ref: `tags/${tag.name}`
      })

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
