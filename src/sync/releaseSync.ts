import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'
import { Release, ReleaseConfig } from '../types'
import { TimelineManager } from '@utils/timelineUtils'

interface ReleaseAnalysis {
  release: Release
  action: 'create' | 'update' | 'skip'
  reason: string
  commitExists: boolean
  isLatest: boolean
  strategy: 'normal' | 'point-to-latest' | 'skip-diverged'
}

interface ReleaseSyncPlan {
  toCreate: ReleaseAnalysis[]
  toUpdate: ReleaseAnalysis[]
  toSkip: ReleaseAnalysis[]
  total: number
}

function logEnhancedSyncPlan(plan: ReleaseSyncPlan): void {
  const totalActions = plan.toCreate.length + plan.toUpdate.length

  if (totalActions === 0) {
    core.info('✅ All releases are already in sync')
    return
  }

  // Only log what we're actually doing
  const actions: string[] = []
  if (plan.toCreate.length > 0)
    actions.push(`Create ${plan.toCreate.length} releases`)
  if (plan.toUpdate.length > 0)
    actions.push(`Update ${plan.toUpdate.length} releases`)

  core.info(`📊 Release Sync Plan: ${actions.join(', ')}`)

  // Group detailed logs under collapsible sections
  if (plan.toSkip.length > 0) {
    core.startGroup('📋 Detailed Analysis')

    // Log what we're doing first
    if (plan.toCreate.length > 0) {
      core.info('🆕 Creating releases:')
      plan.toCreate.forEach(analysis => {
        core.info(`  • ${analysis.release.tag}: ${analysis.reason}`)
      })
    }

    if (plan.toUpdate.length > 0) {
      core.info('🔄 Updating releases:')
      plan.toUpdate.forEach(analysis => {
        core.info(`  • ${analysis.release.tag}: ${analysis.reason}`)
      })
    }

    // Then log what we're skipping and why
    const skippedWithMissingCommits = plan.toSkip.filter(a => !a.commitExists)
    if (skippedWithMissingCommits.length > 0) {
      core.info('⏭️ Skipping releases (missing commits):')
      skippedWithMissingCommits.forEach(analysis => {
        core.info(`  • ${analysis.release.tag}: ${analysis.reason}`)
      })
    }

    // Special handling notifications
    const latestReleaseActions = [...plan.toCreate, ...plan.toUpdate].filter(
      a => a.isLatest
    )
    if (latestReleaseActions.length > 0) {
      core.info('🎯 Latest release special handling:')
      latestReleaseActions.forEach(analysis => {
        core.info(`  • ${analysis.release.tag}: ${analysis.strategy}`)
      })
    }

    core.endGroup()
  }
}

/**
 * Analyze releases and determine sync strategy based on commit existence and configuration
 */
async function analyzeReleases(
  sourceReleases: Release[],
  targetReleases: Release[],
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient,
  config: ReleaseConfig
): Promise<ReleaseSyncPlan> {
  const timelineManager = new TimelineManager()
  const analyses: ReleaseAnalysis[] = []

  try {
    // Sort releases by creation date (newest first) to identify latest
    const sortedReleases = [...sourceReleases].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    for (let i = 0; i < sortedReleases.length; i++) {
      const sourceRelease = sortedReleases[i]
      const isLatest = i === 0 // First in sorted array is latest
      const targetRelease = targetReleases.find(
        r => r.tag === sourceRelease.tag
      )

      // Check if commit exists in target repository
      const commitExists = await timelineManager.commitExists(
        target,
        sourceRelease.commitSha || ''
      )

      // If commit doesn't exist, try to find an equivalent commit
      let equivalentCommitSha: string | null = null
      if (!commitExists && sourceRelease.commitSha) {
        const sourceCommitInfo = await timelineManager.getCommitInfo(
          source,
          sourceRelease.commitSha
        )
        if (sourceCommitInfo) {
          equivalentCommitSha = await timelineManager.findEquivalentCommit(
            sourceCommitInfo,
            target,
            'main'
          )
          if (equivalentCommitSha) {
            core.info(
              `🔍 Found equivalent commit for release ${sourceRelease.tag}: ${equivalentCommitSha}`
            )
          }
        }
      }

      let analysis: ReleaseAnalysis

      if (!targetRelease) {
        // Release doesn't exist in target
        if (!commitExists && !equivalentCommitSha) {
          // Commit doesn't exist and no equivalent found - apply strategy
          if (isLatest && config.latestReleaseStrategy === 'point-to-latest') {
            analysis = {
              release: sourceRelease,
              action: 'create',
              reason: 'Latest release - will point to latest commit',
              commitExists: false,
              isLatest: true,
              strategy: 'point-to-latest'
            }
          } else if (config.divergentCommitStrategy === 'create-anyway') {
            analysis = {
              release: sourceRelease,
              action: 'create',
              reason: 'Creating anyway (divergent commit strategy)',
              commitExists: false,
              isLatest,
              strategy: 'normal'
            }
          } else {
            analysis = {
              release: sourceRelease,
              action: 'skip',
              reason: 'Commit does not exist in target repository',
              commitExists: false,
              isLatest,
              strategy: 'skip-diverged'
            }
          }
        } else {
          // Commit exists or equivalent found - normal creation
          const reason = equivalentCommitSha
            ? `New release with equivalent commit (${equivalentCommitSha})`
            : 'New release with existing commit'

          analysis = {
            release: equivalentCommitSha
              ? { ...sourceRelease, commitSha: equivalentCommitSha }
              : sourceRelease,
            action: 'create',
            reason,
            commitExists: true,
            isLatest,
            strategy: 'normal'
          }
        }
      } else {
        // Release exists - check if update needed
        const sourceDate = new Date(sourceRelease.createdAt).getTime()
        const targetDate = new Date(targetRelease.createdAt).getTime()

        if (sourceDate > targetDate) {
          if (
            !commitExists &&
            !equivalentCommitSha &&
            isLatest &&
            config.latestReleaseStrategy === 'point-to-latest'
          ) {
            analysis = {
              release: sourceRelease,
              action: 'update',
              reason: 'Latest release - will point to latest commit',
              commitExists: false,
              isLatest: true,
              strategy: 'point-to-latest'
            }
          } else if (
            commitExists ||
            equivalentCommitSha ||
            config.divergentCommitStrategy === 'create-anyway'
          ) {
            const reason = equivalentCommitSha
              ? `Source release is newer - using equivalent commit (${equivalentCommitSha})`
              : 'Source release is newer'

            analysis = {
              release: equivalentCommitSha
                ? { ...sourceRelease, commitSha: equivalentCommitSha }
                : sourceRelease,
              action: 'update',
              reason,
              commitExists: commitExists || !!equivalentCommitSha,
              isLatest,
              strategy: 'normal'
            }
          } else {
            analysis = {
              release: sourceRelease,
              action: 'skip',
              reason: 'Commit does not exist in target repository',
              commitExists: false,
              isLatest,
              strategy: 'skip-diverged'
            }
          }
        } else {
          analysis = {
            release: sourceRelease,
            action: 'skip',
            reason: 'Target release is newer or same',
            commitExists,
            isLatest,
            strategy: 'normal'
          }
        }
      }

      analyses.push(analysis)
    }

    return {
      toCreate: analyses.filter(a => a.action === 'create'),
      toUpdate: analyses.filter(a => a.action === 'update'),
      toSkip: analyses.filter(a => a.action === 'skip'),
      total: analyses.length
    }
  } finally {
    await timelineManager.cleanup()
  }
}

export async function syncReleases(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceReleases = await source.syncReleases()
    const targetReleases = await target.syncReleases()

    // Get release configuration
    const releaseConfig =
      source.config.github.sync?.releases || source.config.gitlab.sync?.releases
    if (!releaseConfig) {
      core.warning('No release configuration found, using defaults')
      return []
    }

    core.info('\n🔍 Release Sync Analysis:')

    // Use enhanced analysis
    const syncPlan = await analyzeReleases(
      sourceReleases,
      targetReleases,
      source,
      target,
      releaseConfig
    )

    logEnhancedSyncPlan(syncPlan)

    // Combine releases that need action
    const releasesToSync = [...syncPlan.toCreate, ...syncPlan.toUpdate]

    core.info(`Found ${releasesToSync.length} releases to sync`)

    // Process releases in parallel with controlled concurrency
    const BATCH_SIZE = 3 // Process 3 releases at a time to avoid rate limits
    const batches = []
    for (let i = 0; i < releasesToSync.length; i += BATCH_SIZE) {
      batches.push(releasesToSync.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async analysis => {
          try {
            const release = analysis.release
            let releaseToSync = { ...release }

            // Handle special strategies
            if (analysis.strategy === 'point-to-latest') {
              // Get latest commit from target repository
              const targetBranches = await target.fetchBranches()
              const mainBranch =
                targetBranches.find(b => b.name === 'main') || targetBranches[0]
              if (mainBranch) {
                releaseToSync.commitSha = mainBranch.sha
                core.info(
                  `🎯 Pointing release ${release.tag} to latest commit: ${mainBranch.sha}`
                )
              }
            }

            if (analysis.action === 'update') {
              await target.updateRelease(releaseToSync)
              core.info(`Updated release ${release.tag}`)
            } else {
              await target.createRelease(releaseToSync)
              core.info(`Created release ${release.tag}`)
            }

            if (release.assets.length > 0 && releaseConfig.includeAssets) {
              await syncReleaseAssets(source, target, releaseToSync)
            }
            return { tag: release.tag, status: 'success' }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            core.warning(
              `Failed to sync release ${analysis.release.tag}: ${errorMessage}`
            )
            return {
              tag: analysis.release.tag,
              status: 'failed',
              error: errorMessage
            }
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

      if (successful.length > 0) {
        core.info(
          `✅ ${successful.length} assets synced successfully in this batch`
        )
      }
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
