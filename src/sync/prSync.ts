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
        // Handle merged source PRs - just close the target PR if it's still open
        if (sourcePR.state === 'merged' && targetPR.state === 'open') {
          core.info(
            `🔀 Closing target PR (source was merged): ${sourcePR.title} (open → closed)`
          )
          await target.closePullRequest(targetPR.number!)
        }
        // Handle closed source PRs - close target if it's still open
        else if (sourcePR.state === 'closed' && targetPR.state === 'open') {
          core.info(`🔒 Closing: ${sourcePR.title} (open → closed)`)
          await target.closePullRequest(targetPR.number!)
        }
        // Handle regular updates (title, description, labels, valid state changes)
        else if (needsUpdate(sourcePR, targetPR)) {
          const reason = getUpdateReason(sourcePR, targetPR)
          core.info(`🔄 Updating: ${sourcePR.title} - ${reason}`)
          await target.updatePullRequest(targetPR.number!, sourcePR)
        }
        // Skip if no changes needed
        else {
          core.debug(`⏭️ Skipping: ${sourcePR.title} - already in sync`)
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
  // Never update merged PRs - they are immutable
  if (targetPR.state === 'merged') {
    return false
  }

  // Check basic fields that can always be updated (title, description, labels)
  const basicFieldsChanged =
    sourcePR.title !== targetPR.title ||
    sourcePR.description !== targetPR.description ||
    !arraysEqual(sourcePR.labels, targetPR.labels)

  // Check for valid state changes
  const stateChanged = sourcePR.state !== targetPR.state
  const validStateChange =
    stateChanged &&
    sourcePR.state &&
    targetPR.state &&
    isValidStateTransition(sourcePR.state, targetPR.state)

  return basicFieldsChanged || validStateChange || false
}

/**
 * Determines if a state transition is valid and should trigger an update
 */
function isValidStateTransition(
  sourceState: string,
  targetState: string
): boolean {
  // No change needed if states are the same
  if (sourceState === targetState) {
    return false
  }

  // Valid transitions:
  switch (targetState) {
    case 'open':
      // Can close an open PR or reopen a closed (non-merged) PR
      return sourceState === 'closed'
    case 'closed':
      // Can reopen a closed PR (but this should be rare)
      return sourceState === 'open'
    case 'merged':
      // Merged PRs cannot be changed
      return false
    default:
      return false
  }
}

/**
 * Gets a reason for why a PR needs to be updated
 */
function getUpdateReason(sourcePR: PullRequest, targetPR: PullRequest): string {
  const reasons: string[] = []

  if (sourcePR.title !== targetPR.title) {
    reasons.push('title changed')
  }
  if (sourcePR.description !== targetPR.description) {
    reasons.push('description changed')
  }
  if (!arraysEqual(sourcePR.labels, targetPR.labels)) {
    reasons.push('labels changed')
  }
  if (
    sourcePR.state !== targetPR.state &&
    sourcePR.state &&
    targetPR.state &&
    isValidStateTransition(sourcePR.state, targetPR.state)
  ) {
    reasons.push(`state: ${targetPR.state} → ${sourcePR.state}`)
  }

  return reasons.length > 0 ? reasons.join(', ') : 'unknown changes'
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
