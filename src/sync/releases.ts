import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'
import { Release } from '../types'

export async function syncReleases(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceReleases = await source.syncReleases()
    core.info(`Fetched ${sourceReleases.length} releases from source`)

    const targetReleases = await target.syncReleases()
    core.info(`Fetched ${targetReleases.length} releases from target`)

    // Sort releases by creation time (newest first)
    sourceReleases.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Filter out releases that already exist in target
    // If a release exists, only update if source release is newer
    const releasesToSync = sourceReleases.filter(sourceRelease => {
      const targetRelease = targetReleases.find(
        r => r.tag === sourceRelease.tag
      )
      if (!targetRelease) {
        return true // Release doesn't exist in target, should sync
      }

      // Compare creation times
      return (
        new Date(sourceRelease.createdAt).getTime() >
        new Date(targetRelease.createdAt).getTime()
      )
    })

    core.info(`Found ${releasesToSync.length} releases to sync`)

    // Sync releases
    for (const release of releasesToSync) {
      try {
        const existingRelease = targetReleases.find(r => r.tag === release.tag)
        if (existingRelease) {
          await target.updateRelease(release)
          core.info(`Updated release ${release.tag}`)
        } else {
          await target.createRelease(release)
          core.info(`Created release ${release.tag}`)
        }

        // Sync release assets if any
        if (release.assets.length > 0) {
          await syncReleaseAssets(source, target, release)
        }
      } catch (error) {
        core.warning(
          `Failed to sync release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return releasesToSync
  } catch (error) {
    core.error(
      `Failed to sync releases: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}

async function syncReleaseAssets(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient,
  release: Release
): Promise<void> {
  try {
    for (const asset of release.assets) {
      const assetContent = await source.downloadReleaseAsset(release.id, asset)
      await target.uploadReleaseAsset(release.id, asset, assetContent)
      core.info(`Synced asset ${asset.name} for release ${release.tag}`)
    }
  } catch (error) {
    core.warning(
      `Failed to sync assets for release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
export async function syncTags(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceTags = await source.syncTags()
    core.info(`Fetched ${sourceTags.length} tags from source`)

    const targetTags = await target.syncTags()
    core.info(`Fetched ${targetTags.length} tags from target`)

    // Sort tags by creation time (newest first)
    sourceTags.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Filter out tags that already exist in target
    // If a tag exists, only update if source tag is newer
    const tagsToSync = sourceTags.filter(sourceTag => {
      const targetTag = targetTags.find(t => t.name === sourceTag.name)
      if (!targetTag) {
        return true // Tag doesn't exist in target, should sync
      }

      // Compare creation times
      return (
        new Date(sourceTag.createdAt).getTime() >
        new Date(targetTag.createdAt).getTime()
      )
    })

    core.info(`Found ${tagsToSync.length} tags to sync`)

    // Sync tags
    for (const tag of tagsToSync) {
      try {
        const existingTag = targetTags.find(t => t.name === tag.name)
        if (existingTag) {
          await target.updateTag(tag)
          core.info(`Updated tag ${tag.name}`)
        } else {
          await target.createTag(tag)
          core.info(`Created tag ${tag.name}`)
        }
      } catch (error) {
        core.warning(
          `Failed to sync tag ${tag.name}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return tagsToSync
  } catch (error) {
    core.error(
      `Failed to sync tags: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
