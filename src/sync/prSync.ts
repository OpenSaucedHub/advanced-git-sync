import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'

import { PullRequest } from '../types'
import { getCommentSyncOptions, CommentFormatter } from '../utils/commentUtils'

function logSyncPlan(sourcePRs: PullRequest[], targetPRs: PullRequest[]): void {
  const toCreate = sourcePRs.filter(
    sourcePR => !targetPRs.find(pr => pr.title === sourcePR.title)
  ).length
  const toUpdate = sourcePRs.filter(sourcePR => {
    const targetPR = targetPRs.find(pr => pr.title === sourcePR.title)
    return targetPR && needsUpdate(sourcePR, targetPR)
  }).length
  const toClose = sourcePRs.filter(sourcePR => {
    const targetPR = targetPRs.find(pr => pr.title === sourcePR.title)
    return targetPR && sourcePR.state === 'closed' && targetPR.state === 'open'
  }).length

  const totalActions = toCreate + toUpdate + toClose

  if (totalActions === 0) {
    core.info('✅ All pull requests are already in sync')
    return
  }

  // Only log what we're actually doing
  const actions: string[] = []
  if (toCreate > 0) actions.push(`Create ${toCreate} PRs`)
  if (toUpdate > 0) actions.push(`Update ${toUpdate} PRs`)
  if (toClose > 0) actions.push(`Close ${toClose} PRs`)

  core.info(`📊 Pull Request Sync Plan: ${actions.join(', ')}`)
}

export async function syncPullRequests(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourcePRs = await source.syncPullRequests()

    const targetPRs = await target.syncPullRequests()

    logSyncPlan(sourcePRs, targetPRs)

    // Check if there are any actions to perform
    const hasActions = sourcePRs.some(sourcePR => {
      const targetPR = targetPRs.find(pr => pr.title === sourcePR.title)
      return (
        !targetPR ||
        needsUpdate(sourcePR, targetPR) ||
        (sourcePR.state === 'closed' && targetPR.state === 'open')
      )
    })

    if (!hasActions) {
      return sourcePRs
    }

    // Group detailed operations under collapsible section
    core.startGroup('🔄 Pull Request Operations')

    // Process each source PR
    for (const sourcePR of sourcePRs) {
      const targetPR = targetPRs.find(pr => pr.title === sourcePR.title)

      if (!targetPR) {
        core.info(`🆕 Creating: ${sourcePR.title} (${sourcePR.state})`)

        // Format comments with proper attribution before creating PR
        const prToCreate = await formatPRComments(source, sourcePR)
        await target.createPullRequest(prToCreate)
      } else {
        if (needsUpdate(sourcePR, targetPR)) {
          core.info(
            `🔄 Updating: ${sourcePR.title} (${targetPR.state} → ${sourcePR.state})`
          )
          await target.updatePullRequest(targetPR.number!, sourcePR)
        }

        if (sourcePR.state === 'closed' && targetPR.state === 'open') {
          core.info(`🔒 Closing: ${sourcePR.title} (open → closed)`)
          await target.closePullRequest(targetPR.number!)
        }
      }
    }

    core.endGroup()

    return sourcePRs
  } catch (error) {
    core.error(
      `Failed to sync pull requests: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}

function needsUpdate(sourcePR: PullRequest, targetPR: PullRequest): boolean {
  // Check basic fields that can always be updated
  const basicFieldsChanged =
    sourcePR.title !== targetPR.title ||
    sourcePR.description !== targetPR.description ||
    !arraysEqual(sourcePR.labels, targetPR.labels)

  // Check state changes - be careful about invalid transitions
  const stateChanged = sourcePR.state !== targetPR.state
  const validStateChange =
    stateChanged &&
    // Allow closing an open PR
    ((sourcePR.state === 'closed' && targetPR.state === 'open') ||
      // Allow reopening a closed (but not merged) PR
      (sourcePR.state === 'open' && targetPR.state === 'closed') ||
      // Don't try to change state of merged PRs
      targetPR.state !== 'merged')

  return basicFieldsChanged || validStateChange
}

function arraysEqual(a: string[], b: string[]): boolean {
  return JSON.stringify(a.sort()) === JSON.stringify(b.sort())
}

/**
 * Format PR comments with proper attribution
 */
async function formatPRComments(
  source: GitHubClient | GitLabClient,
  sourcePR: PullRequest
): Promise<PullRequest> {
  if (!sourcePR.comments || sourcePR.comments.length === 0) {
    return sourcePR
  }

  const commentSyncOptions = getCommentSyncOptions(
    source.config,
    'pullRequests'
  )

  if (!commentSyncOptions.enabled) {
    return sourcePR
  }

  const formattedComments = sourcePR.comments.map(comment => {
    const formattedBody = CommentFormatter.formatSyncedComment(
      comment,
      source,
      sourcePR.number!,
      commentSyncOptions
    )

    return {
      ...comment,
      body: formattedBody
    }
  })

  return {
    ...sourcePR,
    comments: formattedComments
  }
}
