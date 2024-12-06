import * as core from '@actions/core'
import { Repository, Config, Issue, Comment } from '@/src/types'

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
            labels: any[]
            number: number
            state: string
            pull_request?: any
          }): Issue => ({
            title: issue.title,
            body: issue.body || '',
            labels: [
              ...this.processLabels(issue.labels),
              ...(this.config.gitlab.sync?.issues.labels ?? [])
            ],
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

  private processLabels(labels: any[]): string[] {
    // First deduplicate and flatten the labels
    const processedLabels = new Set(
      labels
        .map(label => {
          if (typeof label === 'string') return label
          if (typeof label === 'object' && label !== null && 'name' in label) {
            return label.name
          }
          return ''
        })
        .filter(Boolean)
    )

    // Convert back to array and remove any empty strings
    return Array.from(processedLabels).filter(label => label.length > 0)
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
        labels: this.processLabels(issue.labels)
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
        labels: this.processLabels(issue.labels),
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
}
