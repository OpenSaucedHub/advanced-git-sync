import { Config } from '../types'
import { GitHubClient } from './github/GitHub'
import { GitLabClient } from './gitlab/GitLab'
import { getGitHubRepo, getGitLabRepo } from '../utils/repository'

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
