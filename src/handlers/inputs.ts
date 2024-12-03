import * as core from '@actions/core'
import { Config } from '../types'

// Helper function to get input that works with both core.getInput and process.env
export function getActionInput(name: string, required = false): string {
  // Try getting from environment first (composite actions)
  const envValue = process.env[`INPUT_${name.toUpperCase()}`]
  if (envValue !== undefined) {
    return envValue
  }

  // Fallback to core.getInput (node actions)
  return core.getInput(name, { required })
}

// Utility function to safely log configuration details
export function logConfigDetails(config: Partial<Config>, hideTokens = true) {
  // Create a deep copy to avoid mutating the original config
  const safeConfig = JSON.parse(JSON.stringify(config))

  // Start a group for configuration loading logging
  core.startGroup('📋 Configuration Details')

  // Log the safe configuration with color and emojis
  core.info(`\x1b[36m Platform Configuration:\x1b[0m`)
  core.info(
    `  \x1b[34m🦊 GitLab Enabled:\x1b[0m ${safeConfig.gitlab?.enabled || false}`
  )
  core.info(
    `  \x1b[34m🐱 GitHub Enabled:\x1b[0m ${safeConfig.github?.enabled || false}`
  )

  core.info(`\x1b[36m🔄 Sync Options:\x1b[0m`)
  if (safeConfig.gitlab?.sync) {
    core.info(`  \x1b[34m🦊 GitLab Sync:\x1b[0m`)
    core.info(
      JSON.stringify(safeConfig.gitlab.sync, null, 2)
        .split('\n')
        .map(line => `    \x1b[90m${line}\x1b[0m`)
        .join('\n')
    )
  }
  if (safeConfig.github?.sync) {
    core.info(`  \x1b[34m🐱 GitHub Sync:\x1b[0m`)
    core.info(
      JSON.stringify(safeConfig.github.sync, null, 2)
        .split('\n')
        .map(line => `    \x1b[90m${line}\x1b[0m`)
        .join('\n')
    )
  }
  // End the group for configuration loading logging
  core.endGroup()
}
