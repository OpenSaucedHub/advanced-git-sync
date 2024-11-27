import * as core from '@actions/core'
import { ConfigLoader } from './services/config-loader.js'
import { GitLabService } from './services/gitlab-service.js'
import { GitSync } from './services/git-sync.js'

async function run(): Promise<void> {
  try {
    const configLoader = new ConfigLoader()
    const config = await configLoader.loadConfig(core.getInput('config_path'))

    // Initialize services
    const gitLabService = new GitLabService(config)
    const gitSync = new GitSync(config)

    // Setup GitLab remote
    await gitSync.setupRemote()

    // Get current branch name from GITHUB_REF
    const branchName = process.env.GITHUB_REF?.replace('refs/heads/', '')
    if (!branchName) {
      throw new Error('Unable to determine current branch')
    }

    // Sync branch
    await gitSync.syncBranch(branchName)

    core.info('Sync completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
