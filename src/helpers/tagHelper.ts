import * as core from '@actions/core'
import { Repository, Config, Tag } from '../../types'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class TagHelper {
  private repoPath: string | null = null

  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository,
    private config: Config,
    private getProjectId?: () => Promise<number>
  ) {}

  private getRepoPathFromConfig(): string | null {
    if (this.config.gitlab?.projectId) {
      return null
    }

    const owner = this.config.gitlab.owner
    const repo = this.config.gitlab.repo

    if (owner && repo) {
      return `${owner}/${repo}`
    }

    return null
  }

  async syncTags(): Promise<Tag[]> {
    if (this.platform === 'github') {
      return this.syncGitHubTags()
    } else {
      return this.syncGitLabTags()
    }
  }

  private async syncGitHubTags(): Promise<Tag[]> {
    if (!this.config.gitlab.sync?.tags.enabled) {
      return []
    }

    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      core.info('\x1b[36m🏷 Fetching GitHub Tags...\x1b[0m')

      const { data: tags } = await octokit.rest.repos.listTags({
        ...this.repo
      })

      const processedTags = await Promise.all(
        tags.map(async (tag: { name: string; commit: { sha: string } }) => {
          try {
            const { data: refData } = await octokit.rest.git.getRef({
              ...this.repo,
              ref: `tags/${tag.name}`
            })

            const { data: commitData } = await octokit.rest.git.getCommit({
              ...this.repo,
              commit_sha: refData.object.sha
            })

            return {
              name: tag.name,
              createdAt: commitData.author.date,
              commitSha: tag.commit.sha
            }
          } catch (error) {
            core.warning(
              `\x1b[33m⚠️ Failed to process tag ${tag.name}: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
            )
            return {
              name: tag.name,
              createdAt: new Date().toISOString(),
              commitSha: tag.commit.sha
            }
          }
        })
      )

      core.info(`\x1b[32m✓ Tags Fetched: ${processedTags.length} tags\x1b[0m`)
      return processedTags
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Tags: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  private async syncGitLabTags(): Promise<Tag[]> {
    if (!this.config.github.sync?.tags.enabled) {
      return []
    }

    try {
      const gitlab = this.client as Gitlab
      core.info('\x1b[36m🏷 Fetching GitLab Tags...\x1b[0m')

      const projectId = await this.getProjectId!()
      const tags = await gitlab.Tags.all(projectId)

      if (tags.length > 0 && !this.repoPath) {
        const apiUrl = (tags[0] as any)._links?.self || ''
        const match = apiUrl.match(/projects\/(.+?)\/repository/)
        if (match) {
          this.repoPath = decodeURIComponent(match[1])
          core.debug(`Extracted repo path: ${this.repoPath}`)
        }
      }

      const processedTags = tags.map(
        (tag: {
          name: string
          commit: { created_at: string; id: string }
        }) => ({
          name: tag.name,
          createdAt: tag.commit.created_at,
          commitSha: tag.commit.id
        })
      )

      core.info(`\x1b[32m✓ Tags Fetched: ${processedTags.length} tags\x1b[0m`)
      return processedTags
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Tags: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createTag(tag: Tag): Promise<void> {
    if (this.platform === 'github') {
      return this.createGitHubTag(tag)
    } else {
      return this.createGitLabTag(tag)
    }
  }

  private async createGitHubTag(tag: Tag): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      try {
        await octokit.rest.git.getCommit({
          ...this.repo,
          commit_sha: tag.commitSha
        })
      } catch (error) {
        throw new Error(
          `Commit ${tag.commitSha} does not exist in GitHub repository`
        )
      }

      await octokit.rest.git.createRef({
        ...this.repo,
        ref: `refs/tags/${tag.name}`,
        sha: tag.commitSha
      })
    } catch (error) {
      throw new Error(
        `Failed to create tag ${tag.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async createGitLabTag(tag: Tag): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()

      try {
        await gitlab.Commits.show(projectId, tag.commitSha)
      } catch (error) {
        throw new Error(
          `Commit ${tag.commitSha} does not exist in GitLab repository`
        )
      }

      await gitlab.Tags.create(projectId, tag.name, tag.commitSha)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create tag ${tag.name}: ${errorMessage}`)
    }
  }

  async updateTag(tag: Tag): Promise<void> {
    if (this.platform === 'github') {
      return this.updateGitHubTag(tag)
    } else {
      return this.updateGitLabTag(tag)
    }
  }

  private async updateGitHubTag(tag: Tag): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.git.deleteRef({
        ...this.repo,
        ref: `tags/${tag.name}`
      })

      await this.createGitHubTag(tag)
    } catch (error) {
      throw new Error(
        `Failed to update tag ${tag.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async updateGitLabTag(tag: Tag): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()

      try {
        await gitlab.Commits.show(projectId, tag.commitSha)
      } catch (error) {
        throw new Error(
          `Commit ${tag.commitSha} does not exist in GitLab repository`
        )
      }

      try {
        await gitlab.Tags.remove(projectId, tag.name)
      } catch (error) {
        core.debug(`Tag ${tag.name} does not exist, will create new one`)
      }

      await gitlab.Tags.create(projectId, tag.name, tag.commitSha)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to update tag ${tag.name}: ${errorMessage}`)
    }
  }
}
