import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'

export async function syncBranches(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceBranches = await source.syncBranches()
    core.info(`Fetched ${sourceBranches.length} branches from source`)

    const targetBranches = await target.syncBranches()
    core.info(`Fetched ${targetBranches.length} branches from target`)

    // Compare and sync branches
    const branchesToSync = sourceBranches.filter(
      sourceBranch =>
        !targetBranches.some(
          targetBranch => targetBranch.name === sourceBranch.name
        )
    )

    core.info(`Found ${branchesToSync.length} branches to sync`)
    return branchesToSync
  } catch (error) {
    core.error(
      `Failed to sync branches: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
