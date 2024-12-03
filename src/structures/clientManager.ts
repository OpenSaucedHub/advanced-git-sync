// src/structures/clientManager.ts
import { Config } from '../types'
import { GitHubClient } from './github/GitHub'
import { GitLabClient } from './gitlab/GitLab'
import * as core from '@actions/core'
import { getGitHubRepo, getGitLabRepo } from '../utils/repoUtils'

export class ClientManager {
  private static githubClient: GitHubClient
  private static gitlabClient: GitLabClient

  static getGitHubClient(config: Config): GitHubClient {
    if (!this.githubClient) {
      core.startGroup('🐱 GitHub Client Initialization')
      this.githubClient = new GitHubClient(config, getGitHubRepo(config))
      core.info(
        `\x1b[32m✓ GitHub Client Initialized: ${this.githubClient.repo.owner}/${this.githubClient.repo.repo}\x1b[0m`
      )
    }
    return this.githubClient
  }

  static getGitLabClient(config: Config): GitLabClient {
    if (!this.gitlabClient) {
      core.startGroup('🦊 GitLab Client Initialization')

      // Log initialization mode
      if (config.gitlab?.projectId) {
        core.info(
          `Initializing GitLab client with project ID: ${config.gitlab.projectId}`
        )
      } else {
        core.info(
          `Initializing GitLab client with repository: ${config.gitlab?.username || ''}/${config.gitlab?.repo || ''}`
        )
      }

      this.gitlabClient = new GitLabClient(config, getGitLabRepo(config))
      core.endGroup()
    }
    return this.gitlabClient
  }
}
