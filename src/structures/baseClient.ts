// src/structures/clientManager.ts
import { Config, PermissionCheck, Repository } from '@/src/types'
import { GitHubClient } from '@/src/structures/github/GitHub'
import { GitLabClient } from '@/src/structures/gitlab/GitLab'
import { getGitHubRepo, getGitLabRepo } from '../utils/repository'
import * as core from '@actions/core'

export abstract class BaseClient {
  protected config: Config
  protected repo: Repository

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

export class ClientManager {
  private static githubClient: GitHubClient
  private static gitlabClient: GitLabClient

  static getGitHubClient(config: Config): GitHubClient {
    if (!this.githubClient) {
      this.githubClient = new GitHubClient(config, getGitHubRepo(config))
    }
    return this.githubClient
  }

  static getGitLabClient(config: Config): GitLabClient {
    if (!this.gitlabClient) {
      this.gitlabClient = new GitLabClient(config, getGitLabRepo(config))
    }
    return this.gitlabClient
  }
}
