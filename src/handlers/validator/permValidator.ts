import { Config } from '@/src/types'
import { ErrorCodes } from '@utils/errorCodes'
import * as core from '@actions/core'
import { ClientManager } from '@/src/structures/clientManager'

export async function validateTokenPermissions(config: Config): Promise<void> {
  try {
    if (config.github.enabled && config.github.token) {
      const githubClient = ClientManager.getGitHubClient(config)
      try {
        await githubClient.validateAccess()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`${ErrorCodes.EVALGH}: ${message}`)
      }
    }

    if (config.gitlab.enabled && config.gitlab.token) {
      const gitlabClient = ClientManager.getGitLabClient(config)
      try {
        await gitlabClient.validateAccess()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`${ErrorCodes.EVALGL}: ${message}`)
      }
    }

    core.info('\x1b[32m✓ Permission validation completed successfully\x1b[0m')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(message)
    throw error
  }
}
