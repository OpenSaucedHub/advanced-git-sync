import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'

export async function syncReleases(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceReleases = await source.syncReleases()
    core.info(`Fetched ${sourceReleases.length} releases from source`)

    const targetReleases = await target.syncReleases()
    core.info(`Fetched ${targetReleases.length} releases from target`)

    // Compare and sync releases
    const releasesToSync = sourceReleases.filter(
      sourceRelease =>
        !targetReleases.some(
          targetRelease => targetRelease.tag === sourceRelease.tag
        )
    )

    core.info(`Found ${releasesToSync.length} releases to sync`)
    return releasesToSync
  } catch (error) {
    core.error(
      `Failed to sync releases: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
