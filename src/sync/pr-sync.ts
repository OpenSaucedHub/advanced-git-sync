import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'

export async function syncPullRequests(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourcePRs = await source.syncPullRequests()
    core.info(`Fetched ${sourcePRs.length} pull requests from source`)

    const targetPRs = await target.syncPullRequests()
    core.info(`Fetched ${targetPRs.length} pull requests from target`)

    // Compare and sync PRs
    const prsToSync = sourcePRs.filter(
      sourcePR => !targetPRs.some(targetPR => targetPR.title === sourcePR.title)
    )

    core.info(`Found ${prsToSync.length} pull requests to sync`)
    return prsToSync
  } catch (error) {
    core.error(
      `Failed to sync pull requests: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
