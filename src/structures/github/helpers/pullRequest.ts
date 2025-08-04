// src/structures/github/helpers/prHelper.ts
import * as core from '@actions/core'
import { Repository, Config, PullRequest, Comment, Review } from '@/src/types'
import { LabelHelper } from '@/src/utils/labelsUtils'
import {
  getCommentSyncOptions,
  CommentFormatter
} from '@/src/utils/commentUtils'

export class pullRequestHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async syncPullRequests(): Promise<PullRequest[]> {
    if (!this.config.gitlab.sync?.pullRequests.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🔀 Fetching GitHub Pull Requests...\x1b[0m')

      const { data: prs } = await this.octokit.rest.pulls.list({
        ...this.repo,
        state: 'all' // Get all PRs including closed/merged
      })

      const processedPRs = await Promise.all(
        prs.map(
          async (pr: {
            id: number
            number: number
            title: string
            body: string | null
            head: { ref: string }
            base: { ref: string }
            labels: { name: string }[]
            state: string
            merged_at: string | null
          }) => {
            // Fetch comments
            const { data: comments } =
              await this.octokit.rest.issues.listComments({
                ...this.repo,
                issue_number: pr.number
              })

            // Fetch reviews
            const { data: reviews } = await this.octokit.rest.pulls.listReviews(
              {
                ...this.repo,
                pull_number: pr.number
              }
            )

            return {
              id: pr.id,
              number: pr.number,
              title: pr.title,
              description: pr.body || '',
              sourceBranch: pr.head.ref,
              targetBranch: pr.base.ref,
              labels: pr.labels.map(label => label.name),
              state: pr.merged_at
                ? 'merged'
                : (pr.state as 'open' | 'closed' | 'merged'),
              comments: comments.map(
                (comment: {
                  id: number
                  body: string | null
                  user?: { login: string }
                  created_at: string
                }): Comment => ({
                  id: comment.id,
                  body: comment.body || '',
                  author: comment.user?.login || '',
                  createdAt: comment.created_at
                })
              ),
              reviews: reviews.map(
                (review: {
                  id: number
                  state: string
                  body: string | null
                  user?: { login: string }
                  submitted_at: string | null
                }): Review => ({
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
          }
        )
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

  async createPullRequest(pr: PullRequest): Promise<void> {
    try {
      const { data: newPR } = await this.octokit.rest.pulls.create({
        ...this.repo,
        title: pr.title,
        body: pr.description,
        head: pr.sourceBranch,
        base: pr.targetBranch
      })

      // Use LabelHelper to handle labels
      const normalizedLabels = LabelHelper.combineLabels(
        pr.labels,
        this.config,
        'github'
      )

      if (normalizedLabels.length > 0) {
        await this.octokit.rest.issues.addLabels({
          ...this.repo,
          issue_number: newPR.number,
          labels: normalizedLabels
        })
      }

      // Sync comments (formatting will be handled in PR sync logic)
      if (pr.comments) {
        for (const comment of pr.comments) {
          await this.octokit.rest.issues.createComment({
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

  async updatePullRequest(number: number, pr: PullRequest): Promise<void> {
    try {
      // Get current PR state to check if it's merged
      const { data: currentPR } = await this.octokit.rest.pulls.get({
        ...this.repo,
        pull_number: number
      })

      // Prepare update payload
      const updatePayload: any = {
        ...this.repo,
        pull_number: number,
        title: pr.title,
        body: pr.description
      }

      // Only update state if the PR is not merged and the state change is valid
      if (!currentPR.merged_at) {
        // PR is not merged, we can update the state
        if (pr.state === 'merged') {
          updatePayload.state = 'closed' // GitHub doesn't have 'merged' state in update
        } else {
          updatePayload.state = pr.state
        }
      }
      // If PR is merged, we skip state updates as they're not allowed

      await this.octokit.rest.pulls.update(updatePayload)

      // Update labels (this is always allowed)
      await this.octokit.rest.issues.setLabels({
        ...this.repo,
        issue_number: number,
        labels: pr.labels
      })
    } catch (error) {
      throw new Error(
        `Failed to update PR: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async closePullRequest(number: number): Promise<void> {
    try {
      await this.octokit.rest.pulls.update({
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
}
