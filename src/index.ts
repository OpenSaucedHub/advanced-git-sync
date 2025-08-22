// index.ts

import * as core from '@actions/core'
import { getConfig } from './config'
import { syncBranches, syncBranchesBidirectional } from './sync/branchSync'
import { syncPullRequests } from './sync/prSync'
import { syncIssues } from './sync/issueSync'
import { syncReleases } from './sync/releaseSync'
import { ClientManager } from './structures/clientManager'
import { syncTags } from './sync/tagSync'

async function run(): Promise<void> {
  try {
    // Enhanced startup logging
    core.info('\x1b[34m🚀 Repository Synchronization Initialized\x1b[0m')
    core.info('\x1b[90m--------------------------------------------\x1b[0m')

    // Load configuration
    const config = await getConfig()

    // Use ClientManager to get client instances
    const githubClient = ClientManager.getGitHubClient(config)
    const gitlabClient = ClientManager.getGitLabClient(config)

    // validate permissions
    if (config.github.enabled) {
      try {
        await githubClient.validateAccess()
      } catch (error: any) {
        if (
          error.message?.includes('REPO_NOT_FOUND') &&
          config.github.createIfNotExists
        ) {
          core.info('🔧 GitHub repository not found, creating it...')
          const created = await githubClient.createRepositoryIfNotExists()
          if (created) {
            // Re-validate access after creation
            await githubClient.validateAccess()
          }
        } else {
          throw error
        }
      }
    }
    if (config.gitlab.enabled) {
      try {
        await gitlabClient.validateAccess()
      } catch (error: any) {
        if (
          error.message?.includes('REPO_NOT_FOUND') &&
          config.gitlab.createIfNotExists
        ) {
          core.info('🔧 GitLab project not found, creating it...')
          const created = await gitlabClient.createRepositoryIfNotExists()
          if (created) {
            // Re-validate access after creation
            await gitlabClient.validateAccess()
          }
        } else {
          throw error
        }
      }
    }

    if (config.github.enabled && config.gitlab.enabled) {
      core.info(
        '\x1b[36m🔄 Starting bi-directional sync between GitHub and GitLab\x1b[0m'
      )

      // Sync operations organized by chronological dependencies
      // CRITICAL: Branches must be synced first (foundation)
      // HIGH: Tags and Releases depend on branch history
      // MEDIUM: PRs and Issues can run in parallel after core sync

      const coreOperations: {
        name: string
        enabled: boolean
        operation: () => Promise<void>
      }[] = [
        // PHASE 1: Branches (CRITICAL - must run first, with improved bidirectional sync)
        {
          name: '\x1b[34m🌿 Branches (Bidirectional Sync)\x1b[0m',
          enabled:
            (config.github.sync?.branches.enabled || false) &&
            (config.gitlab.sync?.branches.enabled || false),
          operation: async () => {
            await syncBranchesBidirectional(githubClient, gitlabClient)
          }
        },
        // Fallback to unidirectional sync if only one direction is enabled
        {
          name: '\x1b[34m🌿 Branches (GitHub → GitLab)\x1b[0m',
          enabled:
            (config.github.sync?.branches.enabled || false) &&
            !(config.gitlab.sync?.branches.enabled || false),
          operation: async () => {
            await syncBranches(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[34m🌿 Branches (GitLab → GitHub)\x1b[0m',
          enabled:
            !(config.github.sync?.branches.enabled || false) &&
            (config.gitlab.sync?.branches.enabled || false),
          operation: async () => {
            await syncBranches(gitlabClient, githubClient)
          }
        }
      ]

      const tagOperations: {
        name: string
        enabled: boolean
        operation: () => Promise<void>
      }[] = [
        // PHASE 2: Tags (HIGH - depend on branch history)
        {
          name: '\x1b[36m🏷 Tags (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.tags.enabled || false,
          operation: async () => {
            await syncTags(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[36m🏷 Tags (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.tags.enabled || false,
          operation: async () => {
            await syncTags(gitlabClient, githubClient)
          }
        }
      ]

      const releaseOperations: {
        name: string
        enabled: boolean
        operation: () => Promise<void>
      }[] = [
        // PHASE 3: Releases (HIGH - depend on tags)
        {
          name: '\x1b[33m🏷️ Releases (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.releases.enabled || false,
          operation: async () => {
            await syncReleases(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[33m🏷️ Releases (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.releases.enabled || false,
          operation: async () => {
            await syncReleases(gitlabClient, githubClient)
          }
        }
      ]

      const socialOperations: {
        name: string
        enabled: boolean
        operation: () => Promise<void>
      }[] = [
        // PHASE 4: Social features (MEDIUM - can run in parallel)
        {
          name: '\x1b[32m🔀 Pull Requests (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.pullRequests.enabled || false,
          operation: async () => {
            await syncPullRequests(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[32m🔀 Pull Requests (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.pullRequests.enabled || false,
          operation: async () => {
            await syncPullRequests(gitlabClient, githubClient)
          }
        },
        {
          name: '\x1b[35m❗ Issues (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.issues.enabled || false,
          operation: async () => {
            await syncIssues(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[35m❗ Issues (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.issues.enabled || false,
          operation: async () => {
            await syncIssues(gitlabClient, githubClient)
          }
        }
      ]

      // Execute sync operations in chronological order
      const allOperations = [
        ...coreOperations,
        ...tagOperations,
        ...releaseOperations,
        ...socialOperations
      ]
      const enabledOperations = allOperations.filter(op => op.enabled)

      if (enabledOperations.length === 0) {
        core.warning('No sync operations are enabled')
        return
      }

      core.info(
        `\x1b[90m➜ Starting ${enabledOperations.length} sync operations with chronological dependencies...\x1b[0m`
      )

      // Execute operations in phases to respect dependencies
      const results: any[] = []

      // PHASE 1: Core operations (branches) - sequential within phase
      const enabledCoreOps = coreOperations.filter(op => op.enabled)
      if (enabledCoreOps.length > 0) {
        core.info(
          '\x1b[90m📋 Phase 1: Branch synchronization (foundation)\x1b[0m'
        )
        for (const syncOp of enabledCoreOps) {
          try {
            core.info(`\x1b[90m➜ Starting: ${syncOp.name}\x1b[0m`)
            await syncOp.operation()
            core.info(`\x1b[32m✓ Completed: ${syncOp.name}\x1b[0m`)
            results.push({ name: syncOp.name, status: 'success' })
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            core.error(
              `\x1b[31m❌ Failed: ${syncOp.name} - ${errorMessage}\x1b[0m`
            )
            results.push({
              name: syncOp.name,
              status: 'failed',
              error: errorMessage
            })
          }
        }
      }

      // PHASE 2: Tag operations - parallel within phase
      const enabledTagOps = tagOperations.filter(op => op.enabled)
      if (enabledTagOps.length > 0) {
        core.info('\x1b[90m📋 Phase 2: Tag synchronization\x1b[0m')
        const tagResults = await Promise.allSettled(
          enabledTagOps.map(async syncOp => {
            try {
              core.info(`\x1b[90m➜ Starting: ${syncOp.name}\x1b[0m`)
              await syncOp.operation()
              core.info(`\x1b[32m✓ Completed: ${syncOp.name}\x1b[0m`)
              return { name: syncOp.name, status: 'success' }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error)
              core.error(
                `\x1b[31m❌ Failed: ${syncOp.name} - ${errorMessage}\x1b[0m`
              )
              return {
                name: syncOp.name,
                status: 'failed',
                error: errorMessage
              }
            }
          })
        )
        results.push(
          ...tagResults.map(r =>
            r.status === 'fulfilled' ? r.value : r.reason
          )
        )
      }

      // PHASE 3: Release operations - parallel within phase
      const enabledReleaseOps = releaseOperations.filter(op => op.enabled)
      if (enabledReleaseOps.length > 0) {
        core.info('\x1b[90m📋 Phase 3: Release synchronization\x1b[0m')
        const releaseResults = await Promise.allSettled(
          enabledReleaseOps.map(async syncOp => {
            try {
              core.info(`\x1b[90m➜ Starting: ${syncOp.name}\x1b[0m`)
              await syncOp.operation()
              core.info(`\x1b[32m✓ Completed: ${syncOp.name}\x1b[0m`)
              return { name: syncOp.name, status: 'success' }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error)
              core.error(
                `\x1b[31m❌ Failed: ${syncOp.name} - ${errorMessage}\x1b[0m`
              )
              return {
                name: syncOp.name,
                status: 'failed',
                error: errorMessage
              }
            }
          })
        )
        results.push(
          ...releaseResults.map(r =>
            r.status === 'fulfilled' ? r.value : r.reason
          )
        )
      }

      // PHASE 4: Social operations - parallel within phase
      const enabledSocialOps = socialOperations.filter(op => op.enabled)
      if (enabledSocialOps.length > 0) {
        core.info(
          '\x1b[90m📋 Phase 4: Social feature synchronization (PRs & Issues)\x1b[0m'
        )
        const socialResults = await Promise.allSettled(
          enabledSocialOps.map(async syncOp => {
            try {
              core.info(`\x1b[90m➜ Starting: ${syncOp.name}\x1b[0m`)
              await syncOp.operation()
              core.info(`\x1b[32m✓ Completed: ${syncOp.name}\x1b[0m`)
              return { name: syncOp.name, status: 'success' }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error)
              core.error(
                `\x1b[31m❌ Failed: ${syncOp.name} - ${errorMessage}\x1b[0m`
              )
              return {
                name: syncOp.name,
                status: 'failed',
                error: errorMessage
              }
            }
          })
        )
        results.push(
          ...socialResults.map(r =>
            r.status === 'fulfilled' ? r.value : r.reason
          )
        )
      }

      // Report results
      const successful = results.filter(r => r.status === 'success')
      const failed = results.filter(r => r.status === 'failed')

      core.info(
        `\x1b[32m✓ Completed: ${successful.length} operations successful\x1b[0m`
      )
      if (failed.length > 0) {
        core.warning(
          `\x1b[33m⚠️ Failed: ${failed.length} operations failed\x1b[0m`
        )
        // Don't fail the entire action if some operations fail, just warn
      }

      core.info('\x1b[32m🎉 Sync completed successfully!\x1b[0m')
    } else {
      core.warning(
        '\x1b[33m⚠️ Sync not performed: Either GitHub or GitLab sync is disabled in configuration\x1b[0m'
      )
    }

    core.info('\x1b[90m--------------------------------------------\x1b[0m')
    core.info('\x1b[34m🏁 Repository Synchronization Finished\x1b[0m')
  } catch (error) {
    core.info('\x1b[90m--------------------------------------------\x1b[0m')

    if (error instanceof Error) {
      core.setFailed(
        `\x1b[31m❌ Sync Failed: ${error.message} ${error.stack} \x1b[0m`
      )
    } else {
      core.setFailed(
        '\x1b[31m❌ An unexpected error occurred during synchronization\x1b[0m'
      )
    }

    core.info('\x1b[90m--------------------------------------------\x1b[0m')
  }
}

run()
