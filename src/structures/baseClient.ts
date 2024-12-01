import { Config, PermissionCheck, Repository, IClient } from '../types'
import * as core from '@actions/core'

export abstract class BaseClient implements IClient {
  public config: Config
  public repo: Repository

  constructor(config: Config, repo: Repository) {
    this.config = config
    this.repo = repo
  }

  protected async validatePermissions(
    platform: 'github' | 'gitlab',
    sync: any,
    checks: PermissionCheck[]
  ): Promise<void> {
    core.startGroup(`🔍 ${platform.toUpperCase()} Permissions Validation`)
    core.info(
      `\x1b[36mValidating ${platform} permissions for: ${this.repo.owner}/${this.repo.repo}\x1b[0m`
    )

    for (const check of checks) {
      if (sync?.[check.feature as keyof typeof sync]?.enabled) {
        try {
          await check.check()
          core.info(`\x1b[32m✓ ${check.feature} permissions verified\x1b[0m`)
        } catch {
          const errorMessage = `${platform}: ${check.warningMessage}`
          core.setFailed(`\x1b[31m✖ ${errorMessage}\x1b[0m`)
          throw new Error(errorMessage)
        }
      }
    }

    core.endGroup()
  }

  abstract validateAccess(): Promise<void>
}
