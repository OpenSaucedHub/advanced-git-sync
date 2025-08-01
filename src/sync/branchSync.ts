// src/sync/branches.ts
import * as core from '@actions/core'
import { Branch, BranchComparison } from '../types'
import { GitHubClient } from '../structures/github/GitHub'
import { GitLabClient } from '../structures/gitlab/GitLab'

export function compareBranches(
  sourceBranches: Branch[],
  targetBranches: Branch[]
): BranchComparison[] {
  const comparisons: BranchComparison[] = []

  for (const sourceBranch of sourceBranches) {
    const targetBranch = targetBranches.find(b => b.name === sourceBranch.name)

    if (!targetBranch) {
      // Branch doesn't exist in target - needs to be created
      comparisons.push({
        name: sourceBranch.name,
        sourceCommit: sourceBranch.sha,
        action: 'create',
        protected: sourceBranch.protected
      })
      core.debug(`Branch ${sourceBranch.name} will be created in target`)
      continue
    }

    // Branch exists - check if it needs updating
    if (sourceBranch.sha !== targetBranch.sha) {
      comparisons.push({
        name: sourceBranch.name,
        sourceCommit: sourceBranch.sha,
        targetCommit: targetBranch.sha,
        action: 'update',
        protected: sourceBranch.protected
      })
      core.debug(`Branch ${sourceBranch.name} will be updated in target`)
    } else {
      comparisons.push({
        name: sourceBranch.name,
        sourceCommit: sourceBranch.sha,
        targetCommit: targetBranch.sha,
        action: 'skip',
        protected: sourceBranch.protected
      })
      core.debug(`Branch ${sourceBranch.name} is up to date`)
    }
  }

  return comparisons
}

export async function syncBranches(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
): Promise<void> {
  // Fetch branches from both repositories
  const sourceBranches = await source.fetchBranches({
    includeProtected: source.config.github.sync?.branches.protected,
    pattern: source.config.github.sync?.branches.pattern
  })

  const targetBranches = await target.fetchBranches()

  // Compare branches and determine required actions
  const branchComparisons = compareBranches(sourceBranches, targetBranches)

  // Log sync plan
  core.info('\n🔍 Branch Sync Analysis:')
  logSyncPlan(branchComparisons)

  // Process branches in parallel with controlled concurrency
  const actionsToProcess = branchComparisons.filter(c => c.action !== 'skip')
  const skippedBranches = branchComparisons.filter(c => c.action === 'skip')

  // Log skipped branches
  if (skippedBranches.length > 0) {
    core.info(
      `⏭️ Skipping ${skippedBranches.length} branches - already in sync`
    )
    skippedBranches.forEach(branch => {
      core.debug(`  - ${branch.name}`)
    })
  }

  if (actionsToProcess.length === 0) {
    core.info('✓ All branches are already in sync')
    return
  }

  // Process branch operations in parallel with controlled concurrency
  const BRANCH_BATCH_SIZE = 5 // Process 5 branches at a time
  const batches = []
  for (let i = 0; i < actionsToProcess.length; i += BRANCH_BATCH_SIZE) {
    batches.push(actionsToProcess.slice(i, i + BRANCH_BATCH_SIZE))
  }

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async comparison => {
        try {
          switch (comparison.action) {
            case 'create':
              await createBranch(target, comparison)
              return {
                name: comparison.name,
                action: 'create',
                status: 'success'
              }
            case 'update':
              await updateBranch(target, comparison)
              return {
                name: comparison.name,
                action: 'update',
                status: 'success'
              }
            default:
              return {
                name: comparison.name,
                action: comparison.action,
                status: 'skipped'
              }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          core.warning(
            `Failed to ${comparison.action} branch ${comparison.name}: ${errorMessage}`
          )
          return {
            name: comparison.name,
            action: comparison.action,
            status: 'failed',
            error: errorMessage
          }
        }
      })
    )

    // Log batch results
    const successful = batchResults.filter(
      r => r.status === 'fulfilled' && r.value.status === 'success'
    )
    const failed = batchResults.filter(
      r =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && r.value.status === 'failed')
    )

    if (successful.length > 0) {
      core.info(
        `✓ Batch completed: ${successful.length} branches processed successfully`
      )
    }
    if (failed.length > 0) {
      core.warning(
        `⚠️ Batch issues: ${failed.length} branches failed to process`
      )
    }
  }
  core.info('✓ Branch synchronization completed')
}

async function createBranch(
  target: GitHubClient | GitLabClient,
  comparison: BranchComparison
): Promise<void> {
  core.info(`🌱 Creating branch ${comparison.name}`)
  // Implementation will be handled by the specific client (GitHub/GitLab)
  await target.createBranch(comparison.name, comparison.sourceCommit)
  core.info(`✓ Created branch ${comparison.name}`)
}

async function updateBranch(
  target: GitHubClient | GitLabClient,
  comparison: BranchComparison
): Promise<void> {
  core.info(`📝 Updating branch ${comparison.name}`)
  // Implementation will be handled by the specific client (GitHub/GitLab)
  await target.updateBranch(comparison.name, comparison.sourceCommit)
  core.info(`✓ Updated branch ${comparison.name}`)
}

function logSyncPlan(comparisons: BranchComparison[]): void {
  const create = comparisons.filter(c => c.action === 'create').length
  const update = comparisons.filter(c => c.action === 'update').length
  const skip = comparisons.filter(c => c.action === 'skip').length

  core.info(`
📊 Sync Plan Summary:
  - Create: ${create} branches
  - Update: ${update} branches
  - Skip: ${skip} branches (already in sync)
`)
}
