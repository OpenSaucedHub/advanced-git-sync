import * as core from '@actions/core'
import { Config } from '../types'
import { loadConfig } from '@/src/handlers/loader'
import { validateConfig } from '@/src/handlers/validator'

export async function getConfig(): Promise<Config> {
  try {
    // Load and validate configuration
    const config = await loadConfig()
    await validateConfig(config)
    return config
  } catch (error) {
    // Handle all errors
    const message =
      error instanceof Error
        ? `Configuration error: ${error.message}`
        : 'Unexpected configuration error'
    core.setFailed(message)
    throw error
  }
}
