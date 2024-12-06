import * as core from '@actions/core'
import { Repository, Config, Issue, Comment } from '@/src/types'
import { LabelHelper } from '@/src/utils/labelsUtils'

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

      const processedIssues: Issue[] = issues
        .filter((issue: { pull_request?: any }) => !issue.pull_request)
        .map(
          (issue: {
            title: string
            body: string | null
            labels: Array<{ name: string }>
            number: number
            state: string
            pull_request?: any
          }): Issue => ({
            title: issue.title,
            body: issue.body || '',
            labels: LabelHelper.combineLabels(
              issue.labels,
              this.config,
              'github'
            ),
            number: issue.number,
            state: issue.state as 'open' | 'closed'
          })
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

  async getIssueComments(issueNumber: number): Promise<Comment[]> {
    // Check if comment sync is enabled
    if (!this.config.gitlab.sync?.issues.syncComments) {
      core.info('\x1b[33m⚠️ Issue Comments Sync Disabled\x1b[0m')
      return []
    }

    try {
      // Colorful console log for fetching comments
      core.info(
        `\x1b[36m💬 Fetching Comments for Issue #${issueNumber}...\x1b[0m`
      )

      // Fetch comments for a specific issue
      const { data: comments } = await this.octokit.rest.issues.listComments({
        ...this.repo,
        issue_number: issueNumber
      })

      // Process and transform comments
      const processedComments: Comment[] = comments.map(
        (comment: {
          id: number
          body: string | null
          created_at: string
          user?: { login: string }
        }): Comment => ({
          id: comment.id,
          body: comment.body || '',
          createdAt: comment.created_at,
          author: comment.user?.login || 'unknown'
        })
      )

      // Log successful comment fetch
      core.info(
        `\x1b[32m✓ Comments Fetched: ${processedComments.length} comments\x1b[0m`
      )
      return processedComments
    } catch (error) {
      // Error handling with colorful console warning
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
        labels: issue.labels,
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
      // Update an existing issue with the provided details
      await this.octokit.rest.issues.update({
        ...this.repo,
        issue_number: issueNumber,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
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

  async createIssueComment(
    issueNumber: number,
    comment: Comment
  ): Promise<void> {
    try {
      // Create a new comment on a specific issue
      await this.octokit.rest.issues.createComment({
        ...this.repo,
        issue_number: issueNumber,
        body: comment.body
      })
    } catch (error) {
      // Throw a descriptive error if comment creation fails
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
