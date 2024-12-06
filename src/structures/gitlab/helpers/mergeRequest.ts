import { PullRequest, Config, Repository } from '@/src/types'
import * as core from '@actions/core'

export class mergeRequestHelper {
  constructor(
    private gitlab: any,
    private config: Config,
    private getProjectId: () => Promise<number>
  ) {}

  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.github.sync?.pullRequests.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🔀 Fetching GitLab Merge Requests...\x1b[0m')

      const projectId = await this.getProjectId()
      const mrs = await this.gitlab.MergeRequests.all({
        projectId,
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
              projectId,
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
                  author: { owner: string }
                  created_at: string
                }) => ({
                  id: comment.id,
                  body: comment.body || '',
                  author: comment.author.owner,
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
      const projectId = await this.getProjectId()
      const mr = await this.gitlab.MergeRequests.create(
        projectId,
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
            projectId,
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
      const projectId = await this.getProjectId()

      if (pr.state === 'merged') {
        // Try to merge the MR in GitLab
        try {
          await this.gitlab.MergeRequests.merge(projectId, number, {
            should_remove_source_branch: true
          })
          return
        } catch (mergeError: unknown) {
          core.warning(
            `Failed to merge MR #${number}: ${mergeError instanceof Error ? mergeError.message : String(mergeError)}`
          )
          // If merge fails (e.g., due to missing branch), close it instead
          await this.gitlab.MergeRequests.edit(projectId, number, {
            stateEvent: 'close'
          })
        }
      } else {
        // Handle regular updates
        await this.gitlab.MergeRequests.edit(projectId, number, {
          title: pr.title,
          description: pr.description,
          stateEvent: pr.state === 'closed' ? 'close' : 'reopen',
          labels: pr.labels.join(',')
        })
      }
    } catch (error) {
      throw new Error(
        `Failed to update MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async closePullRequest(number: number): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.MergeRequests.edit(projectId, number, {
        stateEvent: 'close'
      })
    } catch (error) {
      throw new Error(
        `Failed to close MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
