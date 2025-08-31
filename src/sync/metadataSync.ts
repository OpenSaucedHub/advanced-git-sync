// src/sync/metadataSync.ts
import { GitHubClient } from '@/src/structures/github/GitHub'
import { GitLabClient } from '@/src/structures/gitlab/GitLab'

export class MetadataSync {
  private githubClient: GitHubClient
  private gitlabClient: GitLabClient

  constructor(githubClient: GitHubClient, gitlabClient: GitLabClient) {
    this.githubClient = githubClient
    this.gitlabClient = gitlabClient
  }

  /**
   * Synchronize repository descriptions bidirectionally
   * Silently fails if descriptions cannot be synced
   */
  async syncDescription(): Promise<void> {
    try {
      const [githubDescription, gitlabDescription] = await Promise.all([
        this.githubClient.getRepositoryDescription(),
        this.gitlabClient.getProjectDescription()
      ])

      // If both descriptions exist and are different, prefer GitHub as source
      if (githubDescription && gitlabDescription) {
        if (githubDescription !== gitlabDescription) {
          await this.gitlabClient.updateProjectDescription(githubDescription)
        }
        return
      }

      // If only GitHub has description, sync to GitLab
      if (githubDescription && !gitlabDescription) {
        await this.gitlabClient.updateProjectDescription(githubDescription)
        return
      }

      // If only GitLab has description, sync to GitHub
      if (!githubDescription && gitlabDescription) {
        await this.githubClient.updateRepositoryDescription(gitlabDescription)
        return
      }

      // If neither has description, nothing to sync
    } catch {
      // Silent failure - description sync is not critical
    }
  }
}
