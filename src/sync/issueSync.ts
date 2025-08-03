// src/sync/issues.ts
import * as core from '@actions/core'
import { GitHubClient } from '../structures/github/GitHub'

import { IssueComparison, Issue } from '../types'
import { GitLabClient } from '../structures/gitlab/GitLab'

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((val, index) => val === b[index])
}

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
      core.info(`Will create: "${sourceIssue.title}" (${sourceIssue.state})`)
      continue
    }

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
  const repoInfo = sourceClient.getRepoInfo()
  const platform = sourceClient instanceof GitHubClient ? 'GitHub' : 'GitLab'

  return `
---

**📋 Synced from ${platform}**
- **Original Issue**: [${sourceIssue.title}](${repoInfo.url}/issues/${sourceIssue.number})
- **Repository**: [${repoInfo.owner}/${repoInfo.repo}](${repoInfo.url})
- **Platform**: ${platform}

> 💬 **Note**: For the complete discussion history and comments, please refer to the original issue above.
`
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

    // Check if there are any actions to perform
    const hasActions = issueComparisons.some(c => c.action !== 'skip')

    if (!hasActions) {
      core.info('✓ Issue synchronization completed')
      return
    }

    // Group detailed operations under collapsible section
    core.startGroup('🔄 Issue Operations')

    // Process each issue according to its required action
    for (const comparison of issueComparisons) {
      try {
        switch (comparison.action) {
          case 'create': {
            core.info(`🆕 Creating: "${comparison.sourceIssue.title}"`)
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
            core.info(`🔄 Updating: "${comparison.sourceIssue.title}"`)
            // Add source link to updated issues as well
            const sourceLink = prepareSourceLink(source, comparison.sourceIssue)
            const issueToUpdate = {
              ...comparison.sourceIssue,
              body: `${comparison.sourceIssue.body || ''}\n\n${sourceLink}`
            }
            await updateIssue(target, {
              ...comparison,
              sourceIssue: issueToUpdate
            })
            break
          case 'skip':
            core.debug(
              `⏭️ Skipping "${comparison.sourceIssue.title}" - already in sync`
            )
            break
        }
      } catch (error) {
        core.warning(
          `Failed to process issue "${comparison.sourceIssue.title}": ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }

    core.endGroup()

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

async function createIssue(
  target: GitHubClient | GitLabClient,
  comparison: IssueComparison
): Promise<void> {
  // Pass the full issue object including the state
  await target.createIssue({
    ...comparison.sourceIssue,
    state: comparison.sourceIssue.state // Explicitly include state
  })
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

  await target.updateIssue(
    comparison.targetIssue.number,
    comparison.sourceIssue
  )
}

function logSyncPlan(comparisons: IssueComparison[]): void {
  const create = comparisons.filter(c => c.action === 'create').length
  const update = comparisons.filter(c => c.action === 'update').length
  const totalActions = create + update

  if (totalActions === 0) {
    core.info('✅ All issues are already in sync')
    return
  }

  // Only log what we're actually doing
  const actions: string[] = []
  if (create > 0) actions.push(`Create ${create} issues`)
  if (update > 0) actions.push(`Update ${update} issues`)

  core.info(`📊 Issue Sync Plan: ${actions.join(', ')}`)
}
