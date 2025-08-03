// src/structures/github/helpers/gitHubTags.ts

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

      // First get list of tags
      const { data: tags } = await this.octokit.rest.repos.listTags({
        ...this.repo
      })

      // Process tags with proper error handling
      const processedTags = await Promise.all(
        tags.map(async (tag: { name: string; commit: { sha: string } }) => {
          try {
            // Get ref details first
            const { data: refData } = await this.octokit.rest.git.getRef({
              ...this.repo,
              ref: `tags/${tag.name}`
            })

            // Get commit details for timestamp
            const { data: commitData } = await this.octokit.rest.git.getCommit({
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
            // Fallback to basic tag info
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
  async createTag(tag: Tag): Promise<void> {
    try {
      // First verify the commit exists in the repository
      try {
        await this.octokit.rest.git.getCommit({
          ...this.repo,
          commit_sha: tag.commitSha
        })
      } catch (error) {
        throw new Error(
          `Commit ${tag.commitSha} does not exist in GitHub repository`
        )
      }

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
