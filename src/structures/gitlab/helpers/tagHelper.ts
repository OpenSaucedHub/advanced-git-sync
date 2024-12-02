import { Tag, Config, Repository } from '@/src/types'
import * as core from '@actions/core'

export class TagHelper {
  constructor(
    private gitlab: any,
    private config: Config,
    private getProjectId: () => Promise<number>
  ) {}

  async syncTags(): Promise<Tag[]> {
    if (!this.config.github.sync?.tags.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷 Fetching GitLab Tags...\x1b[0m')

      const projectId = await this.getProjectId()
      const tags = await this.gitlab.Tags.all(projectId)

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
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.Tags.create(projectId, tag.name, tag.commitSha)
    } catch (error) {
      throw new Error(
        `Failed to create tag ${tag.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async updateTag(tag: Tag): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.Tags.remove(projectId, tag.name)
      await this.createTag(tag)
    } catch (error) {
      throw new Error(
        `Failed to update tag ${tag.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
