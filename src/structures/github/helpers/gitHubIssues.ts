import * as core from '@actions/core'
import { Repository, Config, Issue, Comment } from '@/src/types'
import { LabelHelper } from '@/src/utils/labelsUtils'
import {
  getCommentSyncOptions,
  CommentFormatter
} from '@/src/utils/commentUtils'

export class githubIssueHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async syncIssues(): Promise<Issue[]> {
    if (!this.config.gitlab.sync?.issues.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m❗ Fetching GitHub Issues...\x1b[0m')

      const { data: issues } = await this.octokit.rest.issues.listForRepo({
        ...this.repo,
        state: 'all',
        per_page: 100
      })

      const commentSyncOptions = getCommentSyncOptions(this.config, 'issues')

      const processedIssues: Issue[] = await Promise.all(
        issues
          .filter((issue: { pull_request?: any }) => !issue.pull_request)
          .map(
            async (issue: {
              title: string
              body: string | null
              labels: Array<{ name: string }>
              number: number
              state: string
              pull_request?: any
            }): Promise<Issue> => {
              let comments: Comment[] = []

              // Fetch comments if comment sync is enabled
              if (commentSyncOptions.enabled) {
                comments = await this.fetchIssueComments(issue.number)
              }

              return {
                title: issue.title,
                body: issue.body || '',
                labels: LabelHelper.combineLabels(issue.labels, 'github'),
                number: issue.number,
                state: issue.state as 'open' | 'closed',
                comments
              }
            }
          )
      )

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

  /**
   * Fetch comments for a specific issue
   */
  async fetchIssueComments(issueNumber: number): Promise<Comment[]> {
    try {
      const { data: comments } = await this.octokit.rest.issues.listComments({
        ...this.repo,
        issue_number: issueNumber,
        per_page: 100
      })

      return comments.map(
        (comment: {
          id: number
          body: string | null
          user?: { login: string }
          created_at: string
          updated_at: string
          html_url: string
        }): Comment => ({
          id: comment.id,
          body: comment.body || '',
          author: comment.user?.login || '',
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          sourceUrl: comment.html_url
        })
      )
    } catch (error) {
      core.warning(
        `Failed to fetch comments for issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
      return []
    }
  }

  async createIssue(issue: Issue): Promise<void> {
    try {
      // Ensure labels include 'synced' label
      const normalizedLabels = LabelHelper.combineLabels(issue.labels, 'github')

      await this.octokit.rest.issues.create({
        ...this.repo,
        title: issue.title,
        body: issue.body,
        labels: normalizedLabels,
        state: issue.state
      })
    } catch (error) {
      throw new Error(
        `Failed to create issue "${issue.title}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    try {
      // Ensure labels include 'synced' label
      const normalizedLabels = LabelHelper.combineLabels(issue.labels, 'github')

      // Update an existing issue with the provided details
      await this.octokit.rest.issues.update({
        ...this.repo,
        issue_number: issueNumber,
        title: issue.title,
        body: issue.body,
        labels: normalizedLabels,
        state: issue.state
      })
    } catch (error) {
      // Throw a descriptive error if issue update fails
      throw new Error(
        `Failed to update issue #${issueNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  /**
   * Create a comment on an issue
   */
  async createIssueComment(issueNumber: number, body: string): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        ...this.repo,
        issue_number: issueNumber,
        body
      })
    } catch (error) {
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Update a comment on an issue
   */
  async updateIssueComment(commentId: number, body: string): Promise<void> {
    try {
      await this.octokit.rest.issues.updateComment({
        ...this.repo,
        comment_id: commentId,
        body
      })
    } catch (error) {
      throw new Error(
        `Failed to update comment #${commentId}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
