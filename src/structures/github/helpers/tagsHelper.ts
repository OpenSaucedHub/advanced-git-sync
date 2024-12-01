import * as core from '@actions/core'
import { Repository, Config, Tag } from '@/src/types'

export class tagsHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async syncTags(): Promise<Tag[]> {
    if (!this.config.gitlab.sync?.tags.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷 Fetching GitHub Tags...\x1b[0m')

      const { data: tags } = await this.octokit.rest.repos.listTags({
        ...this.repo
      })

      // Get tag creation times from refs
      const processedTags = await Promise.all(
        tags.map(async (tag: { name: string; commit: { sha: string } }) => {
          try {
            // First, try to get the ref
            const { data: ref } = await this.octokit.rest.git
              .getRef({
                ...this.repo,
                ref: `tags/${tag.name}`
              })
              .catch((error: unknown) => {
                // Log the error but continue
                core.warning(
                  `\x1b[33m⚠️ Could not fetch ref for tag ${tag.name}: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
                )
                return { data: { object: { sha: tag.commit.sha } } }
              })

            // Try to get tag details, but fall back to commit details if fails
            try {
              const { data: tagData } = await this.octokit.rest.git.getTag({
                ...this.repo,
                tag_sha: ref.object.sha
              })

              return {
                name: tag.name,
                createdAt: tagData.tagger?.date || new Date().toISOString(),
                commitSha: tag.commit.sha
              }
            } catch (error) {
              // If getting tag details fails, fall back to commit details
              core.warning(
                `\x1b[33m⚠️ Failed to get tag details for ${tag.name}: ${error instanceof Error ? error.message : String(error)}, falling back to commit details\x1b[0m`
              )
              const { data: commit } = await this.octokit.rest.git.getCommit({
                ...this.repo,
                commit_sha: tag.commit.sha
              })

              return {
                name: tag.name,
                createdAt: commit.author.date,
                commitSha: tag.commit.sha
              }
            }
          } catch (error) {
            core.warning(
              `\x1b[31m❌ Failed to process tag ${tag.name}: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
            )

            // Absolute fallback - use basic tag information
            return {
              name: tag.name,
              createdAt: new Date().toISOString(), // Fallback to current time
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
  async createTag(tag: Tag): Promise<void> {
    try {
      // Create the tag reference
      await this.octokit.rest.git.createRef({
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

  async updateTag(tag: Tag): Promise<void> {
    try {
      // Delete existing tag
      await this.octokit.rest.git.deleteRef({
        ...this.repo,
        ref: `tags/${tag.name}`
      })

      // Create new tag
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
