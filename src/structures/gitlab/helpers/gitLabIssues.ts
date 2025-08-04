import { IssueSchema } from '@gitbeaker/rest'
import { Issue, Config, Comment } from '@/src/types'
import * as core from '@actions/core'
import { LabelHelper } from '@/src/utils/labelsUtils'
import { getCommentSyncOptions } from '@/src/utils/commentUtils'

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

      const commentSyncOptions = getCommentSyncOptions(this.config, 'issues')

      const processedIssues = await Promise.all(
        issues.map(async (issue: IssueSchema) => {
          let comments: Comment[] = []

          // Fetch comments if comment sync is enabled
          if (commentSyncOptions.enabled) {
            comments = await this.fetchIssueComments(projectId, issue.iid)
          }

          return {
            title: issue.title,
            body: issue.description || '',
            labels: LabelHelper.combineLabels(
              issue.labels,
              this.config,
              'gitlab'
            ),
            number: issue.iid,
            state: (issue.state === 'opened' ? 'open' : 'closed') as
              | 'open'
              | 'closed',
            comments
          }
        })
      )

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

  /**
   * Fetch comments (notes) for a specific issue
   */
  async fetchIssueComments(
    projectId: number,
    issueIid: number
  ): Promise<Comment[]> {
    try {
      const notes = await this.gitlab.IssueNotes.all(projectId, issueIid)

      return notes
        .filter((note: any) => !note.system) // Filter out system notes
        .map(
          (note: any): Comment => ({
            id: note.id,
            body: note.body || '',
            author: note.author?.username || '',
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            sourceUrl: `${this.config.gitlab.host || 'https://gitlab.com'}/${this.config.gitlab.owner}/${this.config.gitlab.repo}/-/issues/${issueIid}#note_${note.id}`
          })
        )
    } catch (error) {
      core.warning(
        `Failed to fetch comments for issue #${issueIid}: ${error instanceof Error ? error.message : String(error)}`
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

  /**
   * Create a comment (note) on an issue
   */
  async createIssueComment(issueNumber: number, body: string): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.IssueNotes.create(projectId, issueNumber, body)
    } catch (error) {
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Update a comment (note) on an issue
   */
  async updateIssueComment(
    issueNumber: number,
    noteId: number,
    body: string
  ): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.IssueNotes.edit(projectId, issueNumber, noteId, {
        body
      })
    } catch (error) {
      throw new Error(
        `Failed to update comment #${noteId} on issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
