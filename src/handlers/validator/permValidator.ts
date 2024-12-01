import { Config } from '@/src/types'
import { ErrorCodes } from '@utils/errorCodes'
import * as core from '@actions/core'
import { ClientManager } from '@/src/structures/baseClient'

export async function validateTokenPermissions(config: Config): Promise<void> {
  try {
    if (config.github.enabled && config.github.token) {
      const githubClient = ClientManager.getGitHubClient(config)
      await githubClient.validateAccess() // use permissions helper
    }

    if (config.gitlab.enabled && config.gitlab.token) {
      const gitlabClient = ClientManager.getGitLabClient(config)
      await gitlabClient.validateAccess()
    }

    core.info('\x1b[32m✓ Permission validation completed successfully\x1b[0m')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(`${ErrorCodes.EVAL01}: ${message}`)
    throw new Error(`${ErrorCodes.EVAL01}: ${message}`)
  }
}
