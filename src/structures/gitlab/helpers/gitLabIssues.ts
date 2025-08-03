import { IssueSchema, NoteSchema } from '@gitbeaker/rest'
import { Issue, Comment, Config } from '@/src/types'
import * as core from '@actions/core'
import { LabelHelper } from '@/src/utils/labelsUtils'

export class gitlabIssueHelper {
  constructor(
    private gitlab: any,
    private config: Config,
    private getProjectId: () => Promise<number>
  ) {}

  async syncIssues(): Promise<Issue[]> {
    if (!this.config.github.sync?.issues.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m❗ Fetching GitLab Issues...\x1b[0m')
      const projectId = await this.getProjectId()

      const issues = await this.gitlab.Issues.all({
        projectId: projectId
      })

      const processedIssues = issues.map((issue: IssueSchema) => ({
        title: issue.title,
        body: issue.description || '',
        labels: LabelHelper.combineLabels(issue.labels, this.config, 'gitlab'),
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
      const projectId = await this.getProjectId()

      const notes = await this.gitlab.IssueNotes.all({
        projectId: projectId,
        issueIid: issueNumber
      })

      const processedComments = notes.map((note: NoteSchema) => ({
        id: note.id,
        body: note.body,
        createdAt: note.created_at,
        author: note.author.owner
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
      const projectId = await this.getProjectId()
      await this.gitlab.Issues.create(projectId, {
        title: issue.title,
        description: issue.body,
        labels: LabelHelper.formatForGitLab(issue.labels),
        state_event: issue.state === 'closed' ? 'close' : 'reopen'
      })
    } catch (error) {
      throw new Error(
        `Failed to create issue "${issue.title}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.Issues.edit(projectId, issueNumber, {
        title: issue.title,
        description: issue.body,
        labels: LabelHelper.formatForGitLab(issue.labels),
        state_event: issue.state === 'closed' ? 'close' : 'reopen'
      })
    } catch (error) {
      throw new Error(
        `Failed to update issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async createIssueComment(
    issueNumber: number,
    comment: Comment
  ): Promise<void> {
    try {
      const projectId = await this.getProjectId()

      await this.gitlab.IssueNotes.create({
        projectId: projectId,
        issueIid: issueNumber,
        body: comment.body
      })
    } catch (error) {
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
