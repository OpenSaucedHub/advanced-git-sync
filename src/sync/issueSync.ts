// src/sync/issues.ts
import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'

import { IssueComparison, CommentComparison, Issue, Comment } from '../types'
import { GitLabClient } from '../structures/gitlab/GitLab'

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((val, index) => val === b[index])
}

export function compareIssues(
  sourceIssues: Issue[],
  targetIssues: Issue[]
): IssueComparison[] {
  const comparisons: IssueComparison[] = []

  core.info('\nSource Issues:')
  sourceIssues.forEach(issue =>
    core.info(
      `- ${issue.title} (${issue.state}) [labels: ${issue.labels.join(', ')}]`
    )
  )

  core.info('\nTarget Issues:')
  targetIssues.forEach(issue =>
    core.info(
      `- ${issue.title} (${issue.state}) [labels: ${issue.labels.join(', ')}]`
    )
  )

  for (const sourceIssue of sourceIssues) {
    const targetIssue = targetIssues.find(
      target => target.title === sourceIssue.title
    )

    if (!targetIssue) {
      comparisons.push({
        sourceIssue,
        action: 'create'
      })
      core.info(`Will create: "${sourceIssue.title}" (${sourceIssue.state})`)
      continue
    }

    // Log detailed comparison for debugging
    core.debug(`Comparing issue "${sourceIssue.title}":`)
    core.debug(`- Body match: ${sourceIssue.body === targetIssue.body}`)
    core.debug(`- State match: ${sourceIssue.state === targetIssue.state}`)
    core.debug(
      `- Labels match: ${arraysEqual(sourceIssue.labels, targetIssue.labels)}`
    )

    if (
      sourceIssue.body !== targetIssue.body ||
      sourceIssue.state !== targetIssue.state ||
      !arraysEqual(sourceIssue.labels.sort(), targetIssue.labels.sort())
    ) {
      comparisons.push({
        sourceIssue,
        targetIssue,
        action: 'update'
      })
      core.info(
        `Will update: "${sourceIssue.title}" (${targetIssue.state} → ${sourceIssue.state})`
      )
    } else {
      comparisons.push({
        sourceIssue,
        targetIssue,
        action: 'skip'
      })
      core.info(`Will skip: "${sourceIssue.title}" (already in sync)`)
    }
  }

  return comparisons
}

export function prepareSourceLink(
  sourceClient: GitHubClient | GitLabClient,
  sourceIssue: Issue
): string {
  // Prepare a link to the source issue for tracking
  const repoInfo = sourceClient.getRepoInfo()
  return `**Original Issue**: [${sourceIssue.title}](${repoInfo.url}/issues/${sourceIssue.number})`
}

export function compareComments(
  sourceComments: Comment[],
  targetComments: Comment[]
): CommentComparison[] {
  const comparisons: CommentComparison[] = []

  // Only consider the first and last comments (assuming these are opening/closing comments)
  const openingComment = sourceComments[0]
  const closingComment = sourceComments[sourceComments.length - 1]

  if (
    openingComment &&
    !targetComments.some(c => c.body === openingComment.body)
  ) {
    comparisons.push({
      sourceComment: openingComment,
      action: 'create'
    })
  }

  if (
    closingComment &&
    closingComment !== openingComment &&
    !targetComments.some(c => c.body === closingComment.body)
  ) {
    comparisons.push({
      sourceComment: closingComment,
      action: 'create'
    })
  }

  return comparisons
}

export async function syncIssues(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
): Promise<void> {
  try {
    // Fetch issues from both repositories
    const sourceIssues = await source.syncIssues()
    const targetIssues = await target.syncIssues()

    // Compare issues and determine required actions
    const issueComparisons = compareIssues(sourceIssues, targetIssues)

    // Log sync plan
    core.info('\n🔍 Issue Sync Analysis:')
    logSyncPlan(issueComparisons)

    // Process each issue according to its required action
    for (const comparison of issueComparisons) {
      try {
        switch (comparison.action) {
          case 'create': {
            // Add a link to the original source issue in the body
            const sourceLink = prepareSourceLink(source, comparison.sourceIssue)
            const issueToCreate = {
              ...comparison.sourceIssue,
              body: `${comparison.sourceIssue.body || ''}\n\n${sourceLink}`
            }
            await createIssue(target, {
              sourceIssue: issueToCreate,
              action: 'create'
            })
            break
          }
          case 'update':
            await updateIssue(target, comparison)
            break
          case 'skip':
            core.info(
              `⏭️ Skipping "${comparison.sourceIssue.title}" - already in sync`
            )
            break
        }

        // Sync only opening/closing comments if the issue exists in both repositories
        if (comparison.sourceIssue.number && comparison.targetIssue?.number) {
          await syncIssueComments(
            source,
            target,
            comparison.sourceIssue.number,
            comparison.targetIssue.number
          )
        }
      } catch (error) {
        core.warning(
          `Failed to process issue "${comparison.sourceIssue.title}": ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }

    core.info('✓ Issue synchronization completed')
  } catch (error) {
    core.error(
      `Issue synchronization failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    throw error
  }
}

async function syncIssueComments(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient,
  sourceIssueNumber: number,
  targetIssueNumber: number
): Promise<void> {
  try {
    const sourceComments = await source.getIssueComments(sourceIssueNumber)
    const targetComments = await target.getIssueComments(targetIssueNumber)

    const commentComparisons = compareComments(sourceComments, targetComments)

    for (const comparison of commentComparisons) {
      try {
        if (comparison.action === 'create') {
          await createComment(target, targetIssueNumber, comparison)
        }
      } catch (error) {
        core.warning(
          `Failed to sync comment in issue #${targetIssueNumber}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }
  } catch (error) {
    core.warning(
      `Failed to sync comments for issue #${sourceIssueNumber}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

async function createIssue(
  target: GitHubClient | GitLabClient,
  comparison: IssueComparison
): Promise<void> {
  core.info(`📝 Creating issue "${comparison.sourceIssue.title}"`)
  await target.createIssue(comparison.sourceIssue)
  core.info(`✓ Created issue "${comparison.sourceIssue.title}"`)
}

async function updateIssue(
  target: GitHubClient | GitLabClient,
  comparison: IssueComparison
): Promise<void> {
  if (!comparison.targetIssue?.number) return

  core.debug('Update payload:')
  core.debug(
    JSON.stringify(
      {
        title: comparison.sourceIssue.title,
        body: comparison.sourceIssue.body,
        state: comparison.sourceIssue.state,
        labels: comparison.sourceIssue.labels
      },
      null,
      2
    )
  )

  core.info(`📝 Updating issue "${comparison.sourceIssue.title}"`)
  await target.updateIssue(
    comparison.targetIssue.number,
    comparison.sourceIssue
  )
  core.info(`✓ Updated issue "${comparison.sourceIssue.title}"`)
}
async function createComment(
  target: GitHubClient | GitLabClient,
  issueNumber: number,
  comparison: CommentComparison
): Promise<void> {
  core.info(`💬 Creating comment in issue #${issueNumber}`)
  await target.createIssueComment(issueNumber, comparison.sourceComment)
  core.info(`✓ Created comment in issue #${issueNumber}`)
}

function logSyncPlan(comparisons: IssueComparison[]): void {
  const create = comparisons.filter(c => c.action === 'create').length
  const update = comparisons.filter(c => c.action === 'update').length
  const skip = comparisons.filter(c => c.action === 'skip').length

  core.info(`
📊 Sync Plan Summary:
  - Create: ${create} issues
  - Update: ${update} issues
  - Skip: ${skip} issues (already in sync)
`)
}
