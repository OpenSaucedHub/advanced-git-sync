import * as core from '@actions/core'
import { IssueSchema } from '@gitbeaker/rest'
import { Repository, Config, Issue, Comment } from '../../types'
import { LabelHelper } from '@/src/utils/labelsUtils'
import { getCommentSyncOptions } from '@/src/utils/commentUtils'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class IssueHelper {
  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository,
    private config: Config,
    private getProjectId?: () => Promise<number>
  ) {}

  async syncIssues(): Promise<Issue[]> {
    if (this.platform === 'github') {
      return this.syncGitHubIssues()
    } else {
      return this.syncGitLabIssues()
    }
  }

  private async syncGitHubIssues(): Promise<Issue[]> {
    if (!this.config.gitlab.sync?.issues.enabled) {
      return []
    }

    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      core.info('\x1b[36m❗ Fetching GitHub Issues...\x1b[0m')

      const { data: issues } = await octokit.rest.issues.listForRepo({
        ...this.repo,
        state: 'all',
        per_page: 100
      })

      const commentSyncOptions = getCommentSyncOptions(this.config, 'issues')

      const processedIssues: Issue[] = await Promise.all(
        issues
          .filter((issue: any) => !issue.pull_request)
          .map(async (issue: any): Promise<Issue> => {
            let comments: Comment[] = []

            if (commentSyncOptions.enabled) {
              comments = await this.fetchGitHubIssueComments(issue.number)
            }

            return {
              title: issue.title,
              body: issue.body || '',
              labels: LabelHelper.combineLabels(issue.labels, 'github'),
              number: issue.number,
              state: issue.state as 'open' | 'closed',
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
        `\x1b[31m❌ Failed to Fetch GitHub Issues: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  private async syncGitLabIssues(): Promise<Issue[]> {
    if (!this.config.github.sync?.issues.enabled) {
      return []
    }

    try {
      const gitlab = this.client as Gitlab
      core.info('\x1b[36m❗ Fetching GitLab Issues...\x1b[0m')
      const projectId = await this.getProjectId!()

      const issues = await gitlab.Issues.all({
        projectId: projectId
      })

      const commentSyncOptions = getCommentSyncOptions(this.config, 'issues')

      const processedIssues = await Promise.all(
        issues.map(async (issue: IssueSchema) => {
          let comments: Comment[] = []

          if (commentSyncOptions.enabled) {
            comments = await this.fetchGitLabIssueComments(projectId, issue.iid)
          }

          return {
            title: issue.title,
            body: issue.description || '',
            labels: LabelHelper.combineLabels(issue.labels, 'gitlab'),
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

  async fetchIssueComments(
    issueNumber: number,
    projectId?: number
  ): Promise<Comment[]> {
    if (this.platform === 'github') {
      return this.fetchGitHubIssueComments(issueNumber)
    } else {
      if (projectId === undefined) {
        projectId = await this.getProjectId!()
      }
      return this.fetchGitLabIssueComments(projectId, issueNumber)
    }
  }

  private async fetchGitHubIssueComments(
    issueNumber: number
  ): Promise<Comment[]> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const { data: comments } = await octokit.rest.issues.listComments({
        ...this.repo,
        issue_number: issueNumber,
        per_page: 100
      })

      return comments.map(
        (comment): Comment => ({
          id: comment.id,
          body: comment.body ?? '',
          author: comment.user?.login ?? '',
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

  private async fetchGitLabIssueComments(
    projectId: number,
    issueIid: number
  ): Promise<Comment[]> {
    try {
      const gitlab = this.client as Gitlab
      const notes = await gitlab.IssueNotes.all(projectId, issueIid)

      return notes
        .filter((note: any) => !note.system)
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
    if (this.platform === 'github') {
      return this.createGitHubIssue(issue)
    } else {
      return this.createGitLabIssue(issue)
    }
  }

  private async createGitHubIssue(issue: Issue): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const normalizedLabels = LabelHelper.combineLabels(issue.labels, 'github')

      await octokit.rest.issues.create({
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

  private async createGitLabIssue(issue: Issue): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      const normalizedLabels = LabelHelper.combineLabels(issue.labels, 'gitlab')

      const createdIssue = await gitlab.Issues.create(projectId, issue.title, {
        description: issue.body,
        labels: LabelHelper.formatForGitLab(normalizedLabels)
      })

      // Close the issue if needed (must be done after creation)
      if (issue.state === 'closed' && createdIssue.iid) {
        await gitlab.Issues.edit(projectId, createdIssue.iid, {
          stateEvent: 'close'
        })
      }
    } catch (error) {
      throw new Error(
        `Failed to create issue "${issue.title}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    if (this.platform === 'github') {
      return this.updateGitHubIssue(issueNumber, issue)
    } else {
      return this.updateGitLabIssue(issueNumber, issue)
    }
  }

  private async updateGitHubIssue(
    issueNumber: number,
    issue: Issue
  ): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const normalizedLabels = LabelHelper.combineLabels(issue.labels, 'github')

      await octokit.rest.issues.update({
        ...this.repo,
        issue_number: issueNumber,
        title: issue.title,
        body: issue.body,
        labels: normalizedLabels,
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

  private async updateGitLabIssue(
    issueNumber: number,
    issue: Issue
  ): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      const normalizedLabels = LabelHelper.combineLabels(issue.labels, 'gitlab')

      await gitlab.Issues.edit(projectId, issueNumber, {
        title: issue.title,
        description: issue.body,
        labels: LabelHelper.formatForGitLab(normalizedLabels),
        stateEvent: issue.state === 'closed' ? 'close' : 'reopen'
      })
    } catch (error) {
      throw new Error(
        `Failed to update issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async createIssueComment(issueNumber: number, body: string): Promise<void> {
    if (this.platform === 'github') {
      return this.createGitHubIssueComment(issueNumber, body)
    } else {
      return this.createGitLabIssueComment(issueNumber, body)
    }
  }

  private async createGitHubIssueComment(
    issueNumber: number,
    body: string
  ): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.issues.createComment({
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

  private async createGitLabIssueComment(
    issueNumber: number,
    body: string
  ): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      await gitlab.IssueNotes.create(projectId, issueNumber, body)
    } catch (error) {
      throw new Error(
        `Failed to create comment on issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateIssueComment(
    issueNumberOrCommentId: number,
    commentIdOrBody: number | string,
    body?: string
  ): Promise<void> {
    if (this.platform === 'github') {
      // GitHub only needs commentId and body
      return this.updateGitHubIssueComment(
        issueNumberOrCommentId,
        commentIdOrBody as string
      )
    } else {
      // GitLab needs issueNumber, commentId, and body
      return this.updateGitLabIssueComment(
        issueNumberOrCommentId,
        commentIdOrBody as number,
        body!
      )
    }
  }

  private async updateGitHubIssueComment(
    commentId: number,
    body: string
  ): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.issues.updateComment({
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

  private async updateGitLabIssueComment(
    issueNumber: number,
    noteId: number,
    body: string
  ): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      await gitlab.IssueNotes.edit(projectId, issueNumber, noteId, {
        body
      })
    } catch (error) {
      throw new Error(
        `Failed to update comment #${noteId} on issue #${issueNumber}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
