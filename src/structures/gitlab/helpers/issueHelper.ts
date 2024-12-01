import { IssueSchema, NoteSchema } from '@gitbeaker/rest'
import { Issue, Comment, Config, Repository } from '@/src/types'
import * as core from '@actions/core'

export class IssueHelper {
  constructor(
    private gitlab: any,
    private repo: Repository,
    private config: Config
  ) {}

  private get projectPath(): string {
    return encodeURIComponent(`${this.repo.owner}/${this.repo.repo}`)
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

      const processedIssues = issues.map((issue: IssueSchema) => ({
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

      const processedComments = notes.map((note: NoteSchema) => ({
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
}
