import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'

export async function syncTags(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceTags = await source.syncTags()
    core.info(`Fetched ${sourceTags.length} tags from source`)

    const targetTags = await target.syncTags()
    core.info(`Fetched ${targetTags.length} tags from target`)

    // Compare and sync tags
    const tagsToSync = sourceTags.filter(
      sourceTag => !targetTags.includes(sourceTag)
    )

    core.info(`Found ${tagsToSync.length} tags to sync`)
    return tagsToSync
  } catch (error) {
    core.error(
      `Failed to sync tags: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
