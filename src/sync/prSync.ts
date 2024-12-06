import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'

import { PullRequest } from '../types'

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

  core.info(`
📊 Pull Request Sync Plan:
  - Create: ${toCreate} PRs
  - Update: ${toUpdate} PRs 
  - Close: ${toClose} PRs
  - Skip: ${sourcePRs.length - (toCreate + toUpdate + toClose)} PRs (already in sync)
`)
}

export async function syncPullRequests(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourcePRs = await source.syncPullRequests()
    core.info(`\nSource PRs:`)
    sourcePRs.forEach(pr => core.info(`- ${pr.title} (${pr.state})`))

    const targetPRs = await target.syncPullRequests()
    core.info(`\nTarget PRs:`)
    targetPRs.forEach(pr => core.info(`- ${pr.title} (${pr.state})`))

    logSyncPlan(sourcePRs, targetPRs)

    // Process each source PR
    for (const sourcePR of sourcePRs) {
      const targetPR = targetPRs.find(pr => pr.title === sourcePR.title)

      if (!targetPR) {
        core.info(`Creating new PR: ${sourcePR.title} (${sourcePR.state})`)
        await target.createPullRequest(sourcePR)
      } else {
        if (needsUpdate(sourcePR, targetPR)) {
          core.info(
            `Updating PR: ${sourcePR.title} (${sourcePR.state} → ${targetPR.state})`
          )
          await target.updatePullRequest(targetPR.number!, sourcePR)
        }

        if (sourcePR.state === 'closed' && targetPR.state === 'open') {
          core.info(`Closing PR: ${sourcePR.title} (open → closed)`)
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
