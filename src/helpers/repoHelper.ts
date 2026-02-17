import { Repository } from '../../types'
import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class RepoHelper {
  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository
  ) {}

  async createIfNotExists(): Promise<boolean | number> {
    if (this.platform === 'github') {
      return this.createGitHubRepoIfNotExists()
    } else {
      return this.createGitLabProjectIfNotExists()
    }
  }

  private async createGitHubRepoIfNotExists(): Promise<boolean> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.repos.get({ ...this.repo })
      return false
    } catch (error: any) {
      if (error.status === 404) {
        return await this.createGitHubRepository()
      }
      throw error
    }
  }

  private async createGitHubRepository(): Promise<boolean> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      core.info(
        `⚠️ Repository ${this.repo.owner}/${this.repo.repo} not found. Creating it...`
      )

      const isOrg = await this.isGitHubOrganizationRepo()

      const repoConfig = {
        name: this.repo.repo,
        private: true,
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        auto_init: true,
        has_issues: true,
        has_projects: false,
        has_wiki: false
      }

      if (isOrg) {
        await octokit.rest.repos.createInOrg({
          org: this.repo.owner,
          ...repoConfig
        })
      } else {
        await octokit.rest.repos.createForAuthenticatedUser(repoConfig)
      }

      core.info(
        `✓ Repository ${this.repo.owner}/${this.repo.repo} created successfully`
      )
      return true
    } catch (error: any) {
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

  private async isGitHubOrganizationRepo(): Promise<boolean> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.orgs.get({ org: this.repo.owner })
      return true
    } catch (error: any) {
      if (error.status === 404) {
        return false
      }
      core.debug(
        `Could not determine if ${this.repo.owner} is an organization, assuming personal repository`
      )
      return false
    }
  }

  private async createGitLabProjectIfNotExists(): Promise<number> {
    try {
      const gitlab = this.client as Gitlab
      const path = `${this.repo.owner}/${this.repo.repo}`
      const project = await gitlab.Projects.show(path)

      if (!project?.id) {
        throw new Error('Project ID not found in response')
      }

      return project.id
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('404')) {
        return await this.createGitLabProject()
      }
      throw error
    }
  }

  private async createGitLabProject(): Promise<number> {
    try {
      const gitlab = this.client as Gitlab
      core.info(
        `⚠️ Project ${this.repo.owner}/${this.repo.repo} not found. Creating it...`
      )

      const namespaceInfo = await this.findGitLabNamespace()

      const projectConfig: any = {
        name: this.repo.repo,
        path: this.repo.repo,
        visibility: 'private',
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        initialize_with_readme: true,
        issues_enabled: true,
        merge_requests_enabled: true,
        wiki_enabled: false,
        snippets_enabled: false,
        container_registry_enabled: false,
        only_allow_merge_if_pipeline_succeeds: false,
        only_allow_merge_if_all_discussions_are_resolved: false,
        push_rules: {
          deny_delete_tag: false,
          member_check: false,
          prevent_secrets: false,
          author_email_regex: '',
          file_name_regex: '',
          max_file_size: 0
        }
      }

      // Only set namespace_id for group namespaces.
      // For personal namespaces, omit it so GitLab defaults to the
      // authenticated user's namespace (user IDs are not valid namespace IDs).
      if (namespaceInfo?.type === 'group') {
        projectConfig.namespace_id = namespaceInfo.id
      }

      const createdProject = await gitlab.Projects.create(projectConfig)

      if (!createdProject?.id) {
        throw new Error('Failed to get project ID from created project')
      }

      core.info(
        `✓ Project ${this.repo.owner}/${this.repo.repo} created successfully with force push enabled`
      )
      return createdProject.id
    } catch (error: any) {
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

  private async findGitLabNamespace(): Promise<
    { id: number; type: 'group' } | undefined
  > {
    try {
      const gitlab = this.client as Gitlab

      // 1. Check if the owner is a group namespace
      try {
        const group = await gitlab.Groups.show(this.repo.owner)
        if (group?.id) {
          core.info(
            `Found group namespace: ${this.repo.owner} (ID: ${group.id})`
          )
          return { id: group.id, type: 'group' }
        }
      } catch (error) {
        core.debug(
          `${this.repo.owner} is not a group, checking personal namespace: ${error}`
        )
      }

      // 2. For personal namespaces, verify the owner matches the authenticated user.
      //    We skip namespace_id entirely for personal namespaces because GitLab
      //    user IDs are not valid namespace IDs — omitting it lets GitLab default
      //    to the authenticated user's personal namespace.
      try {
        const currentUser = await gitlab.Users.showCurrentUser()
        if (currentUser?.username === this.repo.owner) {
          core.info(`Using personal namespace for user: ${this.repo.owner}`)
          return undefined
        }

        // Owner doesn't match the authenticated user and isn't a group
        throw new Error(
          `Namespace mismatch: configured owner "${this.repo.owner}" does not match ` +
            `the authenticated GitLab user "${currentUser?.username}" and is not a group. ` +
            `Cannot create projects in another user's namespace. ` +
            `Please ensure the gitlab.owner matches your GitLab username or is a group you have access to.`
        )
      } catch (error) {
        core.debug(`Could not get current user: ${error}`)
      }

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
