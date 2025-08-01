// index.ts

import * as core from '@actions/core'
import { getConfig } from './config'
import { syncBranches } from './sync/branchSync'
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
      await githubClient.validateAccess()
    }
    if (config.gitlab.enabled) {
      await gitlabClient.validateAccess()
    }

    if (config.github.enabled && config.gitlab.enabled) {
      core.info(
        '\x1b[36m🔄 Starting bi-directional sync between GitHub and GitLab\x1b[0m'
      )

      // Sync tracking
      const syncOperations: {
        name: string
        enabled: boolean
        operation: () => Promise<void>
      }[] = [
        // GitHub to GitLab sync operations
        {
          name: '\x1b[34m🌿 Branches (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.branches.enabled || false,
          operation: async () => {
            await syncBranches(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[36m🏷 Tags (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.tags.enabled || false,
          operation: async () => {
            await syncTags(githubClient, gitlabClient)
          }
        },

        {
          name: '\x1b[33m🏷️ Releases (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.releases.enabled || false,
          operation: async () => {
            await syncReleases(githubClient, gitlabClient)
          }
        },

        {
          name: '\x1b[32m🔀 Pull Requests (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.pullRequests.enabled || false,
          operation: async () => {
            await syncPullRequests(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[35m❗ Issues (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.issues.enabled || false,
          operation: async () => {
            await syncIssues(githubClient, gitlabClient)
          }
        },

        // GitLab to GitHub sync operations
        {
          name: '\x1b[34m🌿 Branches (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.branches.enabled || false,
          operation: async () => {
            await syncBranches(gitlabClient, githubClient)
          }
        },

        {
          name: '\x1b[36m🏷 Tags (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.tags.enabled || false,
          operation: async () => {
            await syncTags(gitlabClient, githubClient)
          }
        },
        {
          name: '\x1b[33m🏷️ Releases (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.releases.enabled || false,
          operation: async () => {
            await syncReleases(gitlabClient, githubClient)
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
          name: '\x1b[35m❗ Issues (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.issues.enabled || false,
          operation: async () => {
            await syncIssues(gitlabClient, githubClient)
          }
        }
      ]

      // Execute enabled sync operations in parallel
      const enabledOperations = syncOperations.filter(op => op.enabled)

      if (enabledOperations.length === 0) {
        core.warning('No sync operations are enabled')
        return
      }

      core.info(
        `\x1b[90m➜ Starting ${enabledOperations.length} sync operations in parallel...\x1b[0m`
      )

      const results = await Promise.allSettled(
        enabledOperations.map(async syncOp => {
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
            return { name: syncOp.name, status: 'failed', error: errorMessage }
          }
        })
      )

      // Report results
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 'success'
      )
      const failed = results.filter(
        r =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && r.value.status === 'failed')
      )

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
