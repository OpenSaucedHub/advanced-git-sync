import * as core from '@actions/core'
import { loadConfig } from './config'
import { GitHubClient } from './github'
import { GitLabClient } from './gitlab'
import { syncBranches } from './sync/branches'
import { syncPullRequests } from './sync/pr-sync'
import { syncIssues } from './sync/issues'
import { syncReleases } from './sync/releases'
import { syncTags } from './sync/tags'

async function run(): Promise<void> {
  try {
    const config = await loadConfig()
    core.info('Configuration loaded successfully')

    const githubClient = new GitHubClient(config)
    const gitlabClient = new GitLabClient(config)

    if (config.github.enabled && config.gitlab.enabled) {
      core.info('Starting bi-directional sync between GitHub and GitLab')

      // GitHub to GitLab sync
      if (config['gl-sync'].branches.enabled) {
        await syncBranches(githubClient, gitlabClient)
      }
      if (config['gl-sync'].pullRequests.enabled) {
        await syncPullRequests(githubClient, gitlabClient)
      }
      if (config['gl-sync'].issues.enabled) {
        await syncIssues(githubClient, gitlabClient)
      }
      if (config['gl-sync'].releases.enabled) {
        await syncReleases(githubClient, gitlabClient)
      }
      if (config['gl-sync'].tags.enabled) {
        await syncTags(githubClient, gitlabClient)
      }

      // GitLab to GitHub sync
      if (config['gh-sync'].branches.enabled) {
        await syncBranches(gitlabClient, githubClient)
      }
      if (config['gh-sync'].pullRequests.enabled) {
        await syncPullRequests(gitlabClient, githubClient)
      }
      if (config['gh-sync'].issues.enabled) {
        await syncIssues(gitlabClient, githubClient)
      }
      if (config['gh-sync'].releases.enabled) {
        await syncReleases(gitlabClient, githubClient)
      }
      if (config['gh-sync'].tags.enabled) {
        await syncTags(gitlabClient, githubClient)
      }

      core.info('Sync completed successfully')
    } else {
      core.warning('Either GitHub or GitLab sync is disabled in configuration')
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

run()
