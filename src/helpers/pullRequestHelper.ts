import * as core from '@actions/core'
import { Repository, Config, PullRequest, Comment, Review } from '../../types'
import { LabelHelper } from '@/src/utils/labelsUtils'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class PullRequestHelper {
  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository,
    private config: Config,
    private getProjectId?: () => Promise<number>
  ) {}

  async syncPullRequests(): Promise<PullRequest[]> {
    if (this.platform === 'github') {
      return this.syncGitHubPullRequests()
    } else {
      return this.syncGitLabMergeRequests()
    }
  }

  private async syncGitHubPullRequests(): Promise<PullRequest[]> {
    if (!this.config.gitlab.sync?.pullRequests.enabled) {
      return []
    }

    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      core.info('\x1b[36m🔀 Fetching GitHub Pull Requests...\x1b[0m')

      const { data: prs } = await octokit.rest.pulls.list({
        ...this.repo,
        state: 'all'
      })

      const processedPRs = await Promise.all(
        prs.map(async (pr: any) => {
          const { data: comments } = await octokit.rest.issues.listComments({
            ...this.repo,
            issue_number: pr.number
          })

          const { data: reviews } = await octokit.rest.pulls.listReviews({
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
            labels: pr.labels.map((label: any) => label.name),
            state: pr.merged_at
              ? 'merged'
              : (pr.state as 'open' | 'closed' | 'merged'),
            comments: comments.map(
              (comment: any): Comment => ({
                id: comment.id,
                body: comment.body || '',
                author: comment.user?.login || '',
                createdAt: comment.created_at
              })
            ),
            reviews: reviews.map(
              (review: any): Review => ({
                id: review.id,
                state: review.state.toLowerCase() as
                  | 'approved'
                  | 'changes_requested'
                  | 'commented',
                body: review.body || '',
                author: review.user?.login || '',
                createdAt: review.submitted_at || ''
              })
            )
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

  private async syncGitLabMergeRequests(): Promise<PullRequest[]> {
    if (!this.config.github.sync?.pullRequests.enabled) {
      return []
    }

    try {
      const gitlab = this.client as Gitlab
      core.info('\x1b[36m🔀 Fetching GitLab Merge Requests...\x1b[0m')

      const projectId = await this.getProjectId!()
      const mrs = await gitlab.MergeRequests.all({
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
            const comments = await gitlab.MergeRequestNotes.all(
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
              labels: LabelHelper.combineLabels(mr.labels, 'gitlab'),
              state: (mr.state === 'merged'
                ? 'merged'
                : mr.state === 'opened'
                  ? 'open'
                  : 'closed') as 'merged' | 'open' | 'closed',
              comments: comments.map(
                (comment: any): Comment => ({
                  id: comment.id,
                  body: comment.body || '',
                  author:
                    comment.author?.username || comment.author?.name || '',
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
    if (this.platform === 'github') {
      return this.createGitHubPullRequest(pr)
    } else {
      return this.createGitLabMergeRequest(pr)
    }
  }

  private async createGitHubPullRequest(pr: PullRequest): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const { data: newPR } = await octokit.rest.pulls.create({
        ...this.repo,
        title: pr.title,
        body: pr.description,
        head: pr.sourceBranch,
        base: pr.targetBranch
      })

      const normalizedLabels = LabelHelper.combineLabels(pr.labels, 'github')

      if (normalizedLabels.length > 0) {
        await octokit.rest.issues.addLabels({
          ...this.repo,
          issue_number: newPR.number,
          labels: normalizedLabels
        })
      }

      if (pr.comments) {
        for (const comment of pr.comments) {
          await octokit.rest.issues.createComment({
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

  private async createGitLabMergeRequest(pr: PullRequest): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      const normalizedLabels = LabelHelper.combineLabels(pr.labels, 'gitlab')

      const mr = await gitlab.MergeRequests.create(
        projectId,
        pr.sourceBranch,
        pr.targetBranch,
        pr.title,
        {
          description: pr.description,
          labels: LabelHelper.formatForGitLab(normalizedLabels)
        }
      )

      if (pr.state === 'merged') {
        await gitlab.MergeRequests.accept(projectId, mr.iid, {
          shouldRemoveSourceBranch: true
        })
      } else if (pr.state === 'closed') {
        await gitlab.MergeRequests.edit(projectId, mr.iid, {
          stateEvent: 'close'
        })
      }

      if (pr.comments) {
        for (const comment of pr.comments) {
          await gitlab.MergeRequestNotes.create(projectId, mr.iid, comment.body)
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to create MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updatePullRequest(number: number, pr: PullRequest): Promise<void> {
    if (this.platform === 'github') {
      return this.updateGitHubPullRequest(number, pr)
    } else {
      return this.updateGitLabMergeRequest(number, pr)
    }
  }

  private async updateGitHubPullRequest(
    number: number,
    pr: PullRequest
  ): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const { data: currentPR } = await octokit.rest.pulls.get({
        ...this.repo,
        pull_number: number
      })

      const updatePayload: any = {
        ...this.repo,
        pull_number: number,
        title: pr.title,
        body: pr.description
      }

      if (!currentPR.merged_at) {
        if (pr.state === 'merged') {
          updatePayload.state = 'closed'
        } else {
          updatePayload.state = pr.state
        }
      }

      await octokit.rest.pulls.update(updatePayload)

      const normalizedLabels = LabelHelper.combineLabels(pr.labels, 'github')

      await octokit.rest.issues.setLabels({
        ...this.repo,
        issue_number: number,
        labels: normalizedLabels
      })
    } catch (error) {
      throw new Error(
        `Failed to update PR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async updateGitLabMergeRequest(
    number: number,
    pr: PullRequest
  ): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()

      const currentMR = await gitlab.MergeRequests.show(projectId, number)

      if (pr.state === 'merged') {
        if (
          currentMR.state === 'opened' &&
          currentMR.merge_status === 'can_be_merged'
        ) {
          try {
            await gitlab.MergeRequests.accept(projectId, number, {
              shouldRemoveSourceBranch: true
            })
            return
          } catch (mergeError: unknown) {
            core.warning(
              `Failed to merge MR #${number}: ${mergeError instanceof Error ? mergeError.message : String(mergeError)}`
            )
            await gitlab.MergeRequests.edit(projectId, number, {
              stateEvent: 'close'
            })
          }
        } else {
          core.info(
            `MR #${number} is already ${currentMR.state}, closing instead of merging`
          )
          if (currentMR.state === 'opened') {
            await gitlab.MergeRequests.edit(projectId, number, {
              stateEvent: 'close'
            })
          }
        }
      } else {
        const normalizedLabels = LabelHelper.combineLabels(pr.labels, 'gitlab')

        await gitlab.MergeRequests.edit(projectId, number, {
          title: pr.title,
          description: pr.description,
          stateEvent: pr.state === 'closed' ? 'close' : 'reopen',
          labels: LabelHelper.formatForGitLab(normalizedLabels)
        })
      }
    } catch (error) {
      throw new Error(
        `Failed to update MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async closePullRequest(number: number): Promise<void> {
    if (this.platform === 'github') {
      return this.closeGitHubPullRequest(number)
    } else {
      return this.closeGitLabMergeRequest(number)
    }
  }

  private async closeGitHubPullRequest(number: number): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.pulls.update({
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

  private async closeGitLabMergeRequest(number: number): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      await gitlab.MergeRequests.edit(projectId, number, {
        stateEvent: 'close'
      })
    } catch (error) {
      throw new Error(
        `Failed to close MR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
