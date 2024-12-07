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
