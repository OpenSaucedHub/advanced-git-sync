// src/structures/gitlab/helpers/gitLabTags.ts

import { Tag, Config } from '@/src/types'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'

export class gitlabTagHelper {
  private repoPath: string | null = null

  constructor(
    private gitlab: any,
    private config: Config,
    private getProjectId: () => Promise<number>
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
    if (!this.config.github.sync?.tags.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷 Fetching GitLab Tags...\x1b[0m')

      const projectId = await this.getProjectId()
      const tags = await this.gitlab.Tags.all(projectId)

      // Extract repo path from first tag API URL if available
      if (tags.length > 0 && !this.repoPath) {
        const apiUrl = tags[0]._links?.self || ''
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
    try {
      const projectId = await this.getProjectId()

      // First verify the commit exists
      try {
        await this.gitlab.Commits.show(projectId, tag.commitSha)
      } catch (error) {
        throw new Error(
          `Commit ${tag.commitSha} does not exist in GitLab repository`
        )
      }

      // Create tag with additional parameters
      await this.gitlab.Tags.create(projectId, {
        tag_name: tag.name,
        ref: tag.commitSha
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create tag ${tag.name}: ${errorMessage}`)
    }
  }

  async updateTag(tag: Tag): Promise<void> {
    try {
      const projectId = await this.getProjectId()

      // First verify the commit exists
      try {
        await this.gitlab.Commits.show(projectId, tag.commitSha)
      } catch (error) {
        throw new Error(
          `Commit ${tag.commitSha} does not exist in GitLab repository`
        )
      }

      // Delete existing tag first
      try {
        await this.gitlab.Tags.remove(projectId, tag.name)
      } catch (error) {
        // Tag might not exist, continue
        core.debug(`Tag ${tag.name} does not exist, will create new one`)
      }

      // Create new tag
      await this.gitlab.Tags.create(projectId, {
        tag_name: tag.name,
        ref: tag.commitSha
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to update tag ${tag.name}: ${errorMessage}`)
    }
  }
}
