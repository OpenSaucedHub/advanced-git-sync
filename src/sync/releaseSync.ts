import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'
import { Release } from '../types'

function logSyncPlan(
  sourceReleases: Release[],
  targetReleases: Release[]
): void {
  const toCreate = sourceReleases.filter(
    sourceRelease => !targetReleases.find(r => r.tag === sourceRelease.tag)
  ).length
  const toUpdate = sourceReleases.filter(sourceRelease => {
    const targetRelease = targetReleases.find(r => r.tag === sourceRelease.tag)
    return (
      targetRelease &&
      new Date(sourceRelease.createdAt).getTime() >
        new Date(targetRelease.createdAt).getTime()
    )
  }).length
  const skip = sourceReleases.length - (toCreate + toUpdate)

  core.info(`
📊 Release Sync Plan Summary:
  - Create: ${toCreate} releases
  - Update: ${toUpdate} releases
  - Skip: ${skip} releases (already in sync)
`)
}

export async function syncReleases(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceReleases = await source.syncReleases()
    const targetReleases = await target.syncReleases()

    sourceReleases.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    core.info('\n🔍 Release Sync Analysis:')
    logSyncPlan(sourceReleases, targetReleases)

    const releasesToSync = sourceReleases.filter(sourceRelease => {
      const targetRelease = targetReleases.find(
        r => r.tag === sourceRelease.tag
      )
      if (!targetRelease) return true
      return (
        new Date(sourceRelease.createdAt).getTime() >
        new Date(targetRelease.createdAt).getTime()
      )
    })

    core.info(`Found ${releasesToSync.length} releases to sync`)

    // Process releases in parallel with controlled concurrency
    const BATCH_SIZE = 3 // Process 3 releases at a time to avoid rate limits
    const batches = []
    for (let i = 0; i < releasesToSync.length; i += BATCH_SIZE) {
      batches.push(releasesToSync.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async release => {
          try {
            const existingRelease = targetReleases.find(
              r => r.tag === release.tag
            )
            if (existingRelease) {
              await target.updateRelease(release)
              core.info(`Updated release ${release.tag}`)
            } else {
              await target.createRelease(release)
              core.info(`Created release ${release.tag}`)
            }

            if (release.assets.length > 0) {
              await syncReleaseAssets(source, target, release)
            }
            return { tag: release.tag, status: 'success' }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            core.warning(
              `Failed to sync release ${release.tag}: ${errorMessage}`
            )
            return { tag: release.tag, status: 'failed', error: errorMessage }
          }
        })
      )

      // Log batch results
      const successful = batchResults.filter(
        r => r.status === 'fulfilled' && r.value.status === 'success'
      )
      const failed = batchResults.filter(
        r =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && r.value.status === 'failed')
      )

      if (successful.length > 0) {
        core.info(
          `✓ Batch completed: ${successful.length} releases synced successfully`
        )
      }
      if (failed.length > 0) {
        core.warning(
          `⚠️ Batch issues: ${failed.length} releases failed to sync`
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
    if (release.assets.length === 0) return

    core.info(
      `📦 Syncing ${release.assets.length} assets for release ${release.tag}`
    )

    // Process assets in parallel with controlled concurrency
    const ASSET_BATCH_SIZE = 2 // Process 2 assets at a time to avoid overwhelming APIs
    const assetBatches = []
    for (let i = 0; i < release.assets.length; i += ASSET_BATCH_SIZE) {
      assetBatches.push(release.assets.slice(i, i + ASSET_BATCH_SIZE))
    }

    let processedCount = 0
    for (const batch of assetBatches) {
      const batchResults = await Promise.allSettled(
        batch.map(async asset => {
          try {
            core.info(
              `⬇️ Downloading asset: ${asset.name} (${formatFileSize(asset.size || 0)})`
            )
            const assetContent = await source.downloadReleaseAsset(
              release.id,
              asset
            )

            core.info(`⬆️ Uploading asset: ${asset.name}`)
            await target.uploadReleaseAsset(release.id, asset, assetContent)

            processedCount++
            core.info(
              `✓ Synced asset ${asset.name} (${processedCount}/${release.assets.length})`
            )
            return { name: asset.name, status: 'success' }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            core.warning(`Failed to sync asset ${asset.name}: ${errorMessage}`)
            return { name: asset.name, status: 'failed', error: errorMessage }
          }
        })
      )

      // Log batch progress
      const successful = batchResults.filter(
        r => r.status === 'fulfilled' && r.value.status === 'success'
      )
      const failed = batchResults.filter(
        r =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && r.value.status === 'failed')
      )

      if (failed.length > 0) {
        core.warning(`⚠️ ${failed.length} assets failed in this batch`)
      }
    }

    core.info(`📦 Completed syncing assets for release ${release.tag}`)
  } catch (error) {
    core.warning(
      `Failed to sync assets for release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
