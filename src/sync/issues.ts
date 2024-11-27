import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'

export async function syncIssues(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
) {
  try {
    const sourceIssues = await source.syncIssues()
    core.info(`Fetched ${sourceIssues.length} issues from source`)

    const targetIssues = await target.syncIssues()
    core.info(`Fetched ${targetIssues.length} issues from target`)

    // Compare and sync issues
    const issuesToSync = sourceIssues.filter(
      sourceIssue =>
        !targetIssues.some(
          targetIssue => targetIssue.title === sourceIssue.title
        )
    )

    // Sync comments for matching issues
    for (const sourceIssue of sourceIssues) {
      const targetIssue = targetIssues.find(
        ti => ti.title === sourceIssue.title
      )
      if (targetIssue) {
        await syncIssueComments(
          source,
          target,
          sourceIssue.number,
          targetIssue.number
        )
      }
    }

    core.info(`Found ${issuesToSync.length} issues to sync`)
    return issuesToSync
  } catch (error) {
    core.error(
      `Failed to sync issues: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}

async function syncIssueComments(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient,
  sourceIssueNumber: number,
  targetIssueNumber: number
) {
  try {
    const sourceComments = await source.getIssueComments(sourceIssueNumber)
    const targetComments = await target.getIssueComments(targetIssueNumber)

    const commentsToSync = sourceComments.filter(
      sourceComment =>
        !targetComments.some(
          targetComment =>
            targetComment.body === sourceComment.body &&
            targetComment.author === sourceComment.author
        )
    )

    core.info(
      `Found ${commentsToSync.length} comments to sync for issue #${sourceIssueNumber}`
    )
    return commentsToSync
  } catch (error) {
    core.error(
      `Failed to sync comments for issue #${sourceIssueNumber}: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
