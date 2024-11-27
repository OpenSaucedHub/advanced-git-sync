import { readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { join } from 'path'
import { SyncConfig, SyncConfigSchema } from '../types'
import * as core from '@actions/core'

export class ConfigLoader {
  private static readonly DEFAULT_CONFIG_PATH = '.github/git-sync.yml'

  async loadConfig(customPath?: string): Promise<SyncConfig> {
    const configPath = customPath || ConfigLoader.DEFAULT_CONFIG_PATH

    try {
      const configContent = await readFile(
        join(process.cwd(), configPath),
        'utf8'
      )
      const parsedConfig = load(configContent) as Record<string, unknown>
      return SyncConfigSchema.parse(parsedConfig)
    } catch (error) {
      if (error instanceof Error) {
        core.error(`Failed to load config: ${error.message}`)
      }
      throw error
    }
  }
}
