// src/sync/issues.ts
import * as core from '@actions/core'
import { GitHubClient } from '../github'
import { GitLabClient } from '../gitlab'
import { IssueComparison, CommentComparison, Issue, Comment } from '../types'

export function compareIssues(
  sourceIssues: Issue[],
  targetIssues: Issue[]
): IssueComparison[] {
  const comparisons: IssueComparison[] = []

  for (const sourceIssue of sourceIssues) {
    const targetIssue = targetIssues.find(
      target => target.title === sourceIssue.title
    )

    if (!targetIssue) {
      comparisons.push({
        sourceIssue,
        action: 'create'
      })
      core.debug(`Issue "${sourceIssue.title}" will be created in target`)
      continue
    }

    if (
      sourceIssue.body !== targetIssue.body ||
      sourceIssue.state !== targetIssue.state ||
      !arraysEqual(sourceIssue.labels, targetIssue.labels)
    ) {
      comparisons.push({
        sourceIssue,
        targetIssue,
        action: 'update'
      })
      core.debug(`Issue "${sourceIssue.title}" will be updated in target`)
    } else {
      comparisons.push({
        sourceIssue,
        targetIssue,
        action: 'skip'
      })
      core.debug(`Issue "${sourceIssue.title}" is up to date`)
    }
  }

  return comparisons
}

export function compareComments(
  sourceComments: Comment[],
  targetComments: Comment[]
): CommentComparison[] {
  const comparisons: CommentComparison[] = []

  for (const sourceComment of sourceComments) {
    const targetComment = targetComments.find(
      target =>
        target.body === sourceComment.body &&
        target.author === sourceComment.author
    )

    if (!targetComment) {
      comparisons.push({
        sourceComment,
        action: 'create'
      })
      core.debug(`Comment by ${sourceComment.author} will be created`)
    } else {
      comparisons.push({
        sourceComment,
        action: 'skip'
      })
      core.debug(`Comment by ${sourceComment.author} already exists`)
    }
  }

  return comparisons
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, idx) => val === sortedB[idx])
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
          case 'create':
            await createIssue(target, comparison)
            break
          case 'update':
            await updateIssue(target, comparison)
            break
          case 'skip':
            core.info(
              `⏭️ Skipping "${comparison.sourceIssue.title}" - already in sync`
            )
            break
        }

        // Sync comments if the issue exists in both repositories
        if (comparison.targetIssue) {
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

    core.info('✅ Issue synchronization completed')
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
  core.info(`✅ Created issue "${comparison.sourceIssue.title}"`)
}

async function updateIssue(
  target: GitHubClient | GitLabClient,
  comparison: IssueComparison
): Promise<void> {
  if (!comparison.targetIssue) return

  core.info(`📝 Updating issue "${comparison.sourceIssue.title}"`)
  await target.updateIssue(
    comparison.targetIssue.number,
    comparison.sourceIssue
  )
  core.info(`✅ Updated issue "${comparison.sourceIssue.title}"`)
}

async function createComment(
  target: GitHubClient | GitLabClient,
  issueNumber: number,
  comparison: CommentComparison
): Promise<void> {
  core.info(`💬 Creating comment in issue #${issueNumber}`)
  await target.createIssueComment(issueNumber, comparison.sourceComment)
  core.info(`✅ Created comment in issue #${issueNumber}`)
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
