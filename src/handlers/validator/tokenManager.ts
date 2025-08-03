import * as core from '@actions/core'
import { getActionInput } from '../inputs'
import * as fs from 'fs'
import * as path from 'path'

interface TokenResult {
  token: string | undefined
  warnings: string[]
}

/**
 * Manages token retrieval and basic validation
 */
export class TokenManager {
  private static envLoaded = false

  private static loadEnvFile() {
    if (this.envLoaded) return

    try {
      const envPath = path.join(process.cwd(), '.env')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const envLines = envContent.split('\n')

        for (const line of envLines) {
          const trimmedLine = line.trim()
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=')
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim()
              // Only set if not already in environment
              if (!process.env[key]) {
                process.env[key] = value
              }
            }
          }
        }
        core.debug('✓ Loaded .env file for local development')
      }
    } catch (error) {
      core.debug(
        `Could not load .env file: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    this.envLoaded = true
  }

  private static setTokenEnvironment(tokenName: string, token: string) {
    core.setSecret(token)
    core.exportVariable(tokenName, token)
  }

  static getGitHubToken(): TokenResult {
    // Load .env file for local development
    this.loadEnvFile()

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
    // Load .env file for local development
    this.loadEnvFile()

    const token = getActionInput('GITLAB_TOKEN', false)

    if (token) {
      this.setTokenEnvironment('GITLAB_TOKEN', token)
    }

    return { token, warnings: [] }
  }
}
