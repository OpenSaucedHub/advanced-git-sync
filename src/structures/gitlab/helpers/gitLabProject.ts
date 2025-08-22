import { Repository } from '@/src/types'
import * as core from '@actions/core'

export class gitlabProjectHelper {
  constructor(
    private gitlab: any,
    private repo: Repository
  ) {}

  /**
   * Attempts to create a GitLab project if it doesn't exist
   * @returns Promise<number> - the project ID (existing or newly created)
   */
  async createIfNotExists(): Promise<number> {
    try {
      // First try to get the project
      const path = `${this.repo.owner}/${this.repo.repo}`
      const project = await this.gitlab.Projects.show(path)

      if (!project?.id) {
        throw new Error('Project ID not found in response')
      }

      return project.id // Project already exists
    } catch (error: any) {
      // If it's a 404, the project doesn't exist - create it
      if (error.response?.status === 404 || error.message?.includes('404')) {
        return await this.createProject()
      }
      // For any other error, re-throw it
      throw error
    }
  }

  /**
   * Creates a new GitLab project
   * @returns Promise<number> - the created project ID
   */
  private async createProject(): Promise<number> {
    try {
      core.info(
        `⚠️ Project ${this.repo.owner}/${this.repo.repo} not found. Creating it...`
      )

      // Try to find the correct namespace
      const namespaceId = await this.findNamespace()

      const projectConfig: any = {
        name: this.repo.repo,
        path: this.repo.repo,
        visibility: 'private', // Private by default for security
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        initialize_with_readme: true,
        issues_enabled: true,
        merge_requests_enabled: true,
        wiki_enabled: false,
        snippets_enabled: false,
        container_registry_enabled: false
      }

      // Only add namespace_id if we found one
      if (namespaceId) {
        projectConfig.namespace_id = namespaceId
      }

      const createdProject = await this.gitlab.Projects.create(projectConfig)

      if (!createdProject?.id) {
        throw new Error('Failed to get project ID from created project')
      }

      core.info(
        `✓ Project ${this.repo.owner}/${this.repo.repo} created successfully`
      )
      return createdProject.id
    } catch (error: any) {
      // Handle specific GitLab API errors
      if (error.response?.status === 403) {
        throw new Error(
          `Insufficient permissions to create project ${this.repo.owner}/${this.repo.repo}. ` +
            'Ensure your token has the required "api" scope.'
        )
      } else if (error.response?.status === 400) {
        throw new Error(
          `Project name "${this.repo.repo}" conflicts or validation failed. ` +
            'This typically means the project exists but is inaccessible due to permissions.'
        )
      } else {
        throw new Error(
          `Failed to create project ${this.repo.owner}/${this.repo.repo}: ${
            error.message || 'Unknown error'
          }`
        )
      }
    }
  }

  /**
   * Finds the correct namespace ID for the project
   * @returns Promise<number | undefined> - the namespace ID or undefined if not found
   */
  private async findNamespace(): Promise<number | undefined> {
    try {
      // First try to find as a group/organization
      try {
        const group = await this.gitlab.Groups.show(this.repo.owner)
        if (group?.id) {
          return group.id
        }
      } catch (error) {
        // Not a group, continue to try as user
        core.debug(`${this.repo.owner} is not a group, trying as user`)
      }

      // Try to find as a user
      try {
        const users = await this.gitlab.Users.search(this.repo.owner)
        const user = users.find((u: any) => u.username === this.repo.owner)
        if (user?.id) {
          return user.id
        }
      } catch (error) {
        core.debug(`Could not find user ${this.repo.owner}`)
      }

      // Fallback: get current user's namespace
      try {
        const currentUser = await this.gitlab.Users.current()
        if (currentUser?.id) {
          core.warning(
            `Could not find namespace for ${this.repo.owner}, falling back to personal namespace`
          )
          return currentUser.id
        }
      } catch (error) {
        core.debug(`Could not get current user: ${error}`)
      }

      // Final fallback - return undefined to let GitLab use default namespace
      core.warning(
        `Could not determine namespace for ${this.repo.owner}, using default namespace`
      )
      return undefined
    } catch (error) {
      core.warning(
        `Error during namespace resolution for ${this.repo.owner}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }, using default namespace`
      )
      return undefined
    }
  }
}
