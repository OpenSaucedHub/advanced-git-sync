import { Repository } from '@/src/types'
import * as core from '@actions/core'

export class githubRepoHelper {
  constructor(
    private octokit: any,
    private repo: Repository
  ) {}

  /**
   * Attempts to create a GitHub repository if it doesn't exist
   * @returns Promise<boolean> - true if repository was created, false if it already existed
   */
  async createIfNotExists(): Promise<boolean> {
    try {
      // First check if repository exists
      await this.octokit.rest.repos.get({ ...this.repo })
      return false // Repository already exists
    } catch (error: any) {
      // If it's a 404, the repository doesn't exist - create it
      if (error.status === 404) {
        return await this.createRepository()
      }
      // For any other error, re-throw it
      throw error
    }
  }

  /**
   * Creates a new GitHub repository
   * @returns Promise<boolean> - true if successfully created
   */
  private async createRepository(): Promise<boolean> {
    try {
      core.info(
        `⚠️ Repository ${this.repo.owner}/${this.repo.repo} not found. Creating it...`
      )

      // Determine if this is an organization or personal repository
      const isOrg = await this.isOrganizationRepo()

      const repoConfig = {
        name: this.repo.repo,
        private: true, // Private by default for security
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        auto_init: true, // Initialize with README
        has_issues: true,
        has_projects: false,
        has_wiki: false
      }

      if (isOrg) {
        // Create organization repository
        await this.octokit.rest.repos.createInOrg({
          org: this.repo.owner,
          ...repoConfig
        })
      } else {
        // Create personal repository
        await this.octokit.rest.repos.createForAuthenticatedUser(repoConfig)
      }

      core.info(
        `✓ Repository ${this.repo.owner}/${this.repo.repo} created successfully`
      )
      return true
    } catch (error: any) {
      // Handle specific GitHub API errors
      if (error.status === 403) {
        throw new Error(
          `Insufficient permissions to create repository ${this.repo.owner}/${this.repo.repo}. ` +
            'Ensure your token has the required "repo" scope.'
        )
      } else if (error.status === 422) {
        throw new Error(
          `Repository name "${this.repo.repo}" conflicts or validation failed. ` +
            'This typically means the repository exists but is inaccessible due to permissions.'
        )
      } else {
        throw new Error(
          `Failed to create repository ${this.repo.owner}/${this.repo.repo}: ${
            error.message || 'Unknown error'
          }`
        )
      }
    }
  }

  /**
   * Determines if the target repository should be created in an organization
   * @returns Promise<boolean> - true if organization, false if personal
   */
  private async isOrganizationRepo(): Promise<boolean> {
    try {
      // Try to get organization info
      await this.octokit.rest.orgs.get({ org: this.repo.owner })
      return true
    } catch (error: any) {
      // If 404, it's likely a personal repository
      if (error.status === 404) {
        return false
      }
      // For other errors, assume personal repository as fallback
      core.debug(
        `Could not determine if ${this.repo.owner} is an organization, assuming personal repository`
      )
      return false
    }
  }
}
