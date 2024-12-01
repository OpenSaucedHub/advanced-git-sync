import * as core from '@actions/core'
import { getActionInput } from '../inputs'

interface TokenResult {
  token: string | undefined
  warnings: string[]
}

/**
 * Manages token retrieval and basic validation
 */
export class TokenManager {
  private static setTokenEnvironment(tokenName: string, token: string) {
    core.setSecret(token)
    core.exportVariable(tokenName, token)
  }

  static getGitHubToken(): TokenResult {
    const warnings: string[] = []
    const inputToken = getActionInput('GITHUB_TOKEN')
    const envToken = process.env.GITHUB_TOKEN
    const token = inputToken || envToken

    if (!inputToken && envToken) {
      warnings.push(
        'Using default GITHUB_TOKEN. This may have limited permissions. Consider providing a custom token with explicit repository access.'
      )
    }

    if (token) {
      this.setTokenEnvironment('GITHUB_TOKEN', token)
    }

    return { token, warnings }
  }

  static getGitLabToken(): TokenResult {
    const token = getActionInput('GITLAB_TOKEN', false)

    if (token) {
      this.setTokenEnvironment('GITLAB_TOKEN', token)
    }

    return { token, warnings: [] }
  }
}
