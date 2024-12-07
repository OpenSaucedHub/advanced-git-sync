import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'

export async function syncTags(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceTags = await source.syncTags()
    core.info(`Fetched ${sourceTags.length} tags from source`)

    const targetTags = await target.syncTags()
    core.info(`Fetched ${targetTags.length} tags from target`)

    sourceTags.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const tagsToSync = sourceTags.filter(sourceTag => {
      const targetTag = targetTags.find(t => t.name === sourceTag.name)
      if (!targetTag) return true
      return (
        new Date(sourceTag.createdAt).getTime() >
        new Date(targetTag.createdAt).getTime()
      )
    })

    core.info(`Found ${tagsToSync.length} tags to sync`)

    for (const tag of tagsToSync) {
      try {
        const existingTag = targetTags.find(t => t.name === tag.name)
        if (existingTag) {
          await target.updateTag(tag)
          core.info(`Updated tag ${tag.name}`)
        } else {
          await target.createTag(tag)
          core.info(`Created tag ${tag.name}`)
        }
      } catch (error) {
        core.warning(
          `Failed to sync tag ${tag.name}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return tagsToSync
  } catch (error) {
    core.error(
      `Failed to sync tags: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
