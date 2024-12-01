import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'

import { PullRequest } from '../types'

export async function syncPullRequests(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourcePRs = await source.syncPullRequests()
    core.info(`Fetched ${sourcePRs.length} pull requests from source`)

    const targetPRs = await target.syncPullRequests()
    core.info(`Fetched ${targetPRs.length} pull requests from target`)

    // Process each source PR
    for (const sourcePR of sourcePRs) {
      const targetPR = targetPRs.find(pr => pr.title === sourcePR.title)

      if (!targetPR) {
        // Create new PR if it doesn't exist in target
        core.info(`Creating new PR: ${sourcePR.title}`)
        await target.createPullRequest(sourcePR)
      } else {
        // Update existing PR if needed
        if (needsUpdate(sourcePR, targetPR)) {
          core.info(`Updating PR: ${sourcePR.title}`)
          await target.updatePullRequest(targetPR.number!, sourcePR)
        }

        // Handle state changes
        if (sourcePR.state === 'closed' && targetPR.state === 'open') {
          core.info(`Closing PR: ${sourcePR.title}`)
          await target.closePullRequest(targetPR.number!)
        }
      }
    }

    return sourcePRs
  } catch (error) {
    core.error(
      `Failed to sync pull requests: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}

function needsUpdate(sourcePR: PullRequest, targetPR: PullRequest): boolean {
  return (
    sourcePR.title !== targetPR.title ||
    sourcePR.description !== targetPR.description ||
    !arraysEqual(sourcePR.labels, targetPR.labels) ||
    sourcePR.state !== targetPR.state
  )
}

function arraysEqual(a: string[], b: string[]): boolean {
  return JSON.stringify(a.sort()) === JSON.stringify(b.sort())
}
