import { PullRequest, Config, Repository } from '@/src/types'
import * as core from '@actions/core'

export class PullRequestHelper {
  constructor(
    private gitlab: any,
    private repo: Repository,
    private config: Config
  ) {}

  private get projectPath(): string {
    return encodeURIComponent(`${this.repo.owner}/${this.repo.repo}`)
  }

  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.github.sync?.pullRequests.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🔀 Fetching GitLab Merge Requests...\x1b[0m')

      const mrs = await this.gitlab.MergeRequests.all({
        projectId: this.projectPath,
        scope: 'all'
      })

      const processedPRs = await Promise.all(
        mrs.map(
          async (mr: {
            id: number
            iid: number
            title: string
            description: string | null
            source_branch: string
            target_branch: string
            labels?: string[]
            state: string
          }) => {
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
              comments: comments.map(
                (comment: {
                  id: number
                  body: string
                  author: { username: string }
                  created_at: string
                }) => ({
                  id: comment.id,
                  body: comment.body || '',
                  author: comment.author.username,
                  createdAt: comment.created_at
                })
              )
            }
          }
        )
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
}
