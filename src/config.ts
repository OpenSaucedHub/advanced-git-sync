import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from './types'

export async function loadConfig(): Promise<Config> {
  const configPath =
    core.getInput('config_path', { required: false }) ||
    '.github/sync-config.yml'

  try {
    const configContent = fs.readFileSync(configPath, 'utf8')
    const parsedConfig = yaml.load(configContent) as Record<string, unknown>

    return ConfigSchema.parse(parsedConfig)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config: ${error.message}`)
    }
    throw error
  }
}
