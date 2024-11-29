// index.ts

import * as core from '@actions/core'
import { getConfig } from './config'
import { GitHubClient } from './github'
import { GitLabClient } from './gitlab'
import { syncBranches } from './sync/branches'
import { syncPullRequests } from './sync/pr-sync'
import { syncIssues } from './sync/issues'
import { syncReleases, syncTags } from './sync/releases'

async function run(): Promise<void> {
  try {
    // Enhanced startup logging
    core.info('\x1b[34m🚀 Repository Synchronization Action Initialized\x1b[0m')
    core.info('\x1b[90m--------------------------------------------\x1b[0m')

    // Load configuration
    const config = await getConfig()
    core.info(`\x1b[32m✅ Configuration loaded successfully\x1b[0m`)

    // Create clients
    const githubClient = new GitHubClient(config)
    const gitlabClient = new GitLabClient(config)

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
        {
          name: '\x1b[33m🏷️ Releases (GitHub → GitLab)\x1b[0m',
          enabled: config.github.sync?.releases.enabled || false,
          operation: async () => {
            await syncReleases(githubClient, gitlabClient)
          }
        },
        {
          name: '\x1b[36m🏷 Tags (GitHub → GitLab)\x1b[0m',
          enabled:
            config.github.sync?.tags.enabled ||
            config.github.sync?.releases.enabled ||
            false,
          operation: async () => {
            await syncTags(githubClient, gitlabClient)
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
        },
        {
          name: '\x1b[33m🏷️ Releases (GitLab → GitHub)\x1b[0m',
          enabled: config.gitlab.sync?.releases.enabled || false,
          operation: async () => {
            await syncReleases(gitlabClient, githubClient)
          }
        },
        {
          name: '\x1b[36m🏷 Tags (GitLab → GitHub)\x1b[0m',
          enabled:
            config.gitlab.sync?.tags.enabled ||
            config.gitlab.sync?.releases.enabled ||
            false,
          operation: async () => {
            await syncTags(gitlabClient, githubClient)
          }
        }
      ]

      // Execute enabled sync operations
      for (const syncOp of syncOperations) {
        if (syncOp.enabled) {
          core.info(`\x1b[90m➜ Syncing: ${syncOp.name}\x1b[0m`)
          await syncOp.operation()
          core.info(`\x1b[32m✓ Completed: ${syncOp.name}\x1b[0m`)
        }
      }

      core.info('\x1b[32m🎉 Sync completed successfully!\x1b[0m')
    } else {
      core.warning(
        '\x1b[33m⚠️ Sync not performed: Either GitHub or GitLab sync is disabled in configuration\x1b[0m'
      )
    }

    core.info('\x1b[90m--------------------------------------------\x1b[0m')
    core.info('\x1b[34m🏁 Repository Synchronization Action Finished\x1b[0m')
  } catch (error) {
    core.info('\x1b[90m--------------------------------------------\x1b[0m')

    if (error instanceof Error) {
      core.setFailed(`\x1b[31m❌ Sync Failed: ${error.message}\x1b[0m`)
    } else {
      core.setFailed(
        '\x1b[31m❌ An unexpected error occurred during synchronization\x1b[0m'
      )
    }

    core.info('\x1b[90m--------------------------------------------\x1b[0m')
  }
}

run()
