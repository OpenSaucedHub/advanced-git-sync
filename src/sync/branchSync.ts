// src/sync/branches.ts
import * as core from '@actions/core'
import { Branch, BranchComparison, Config } from '../../types'
import { GitHubClient } from '../structures/GitHub'
import { GitLabClient } from '../structures/GitLab'
import { botDefaults, protectedBranches } from '../utils/defaults'

/**
 * Converts glob patterns to regex patterns
 */
function globToRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\[([^\]]+)\]/g, '[$1]')
  return new RegExp(`^${regexPattern}$`)
}

/**
 * Gets the bot branch strategy and patterns from configuration
 */
function getBotBranchConfig(config: Config): {
  strategy: 'delete-orphaned' | 'sync' | 'skip'
  patterns: string[]
} {
  const botConfig =
    config.github.sync?.branches?.botBranches ||
    config.gitlab.sync?.branches?.botBranches

  return {
    strategy: botConfig?.strategy || 'delete-orphaned',
    patterns:
      botConfig?.patterns && botConfig.patterns.length > 0
        ? botConfig.patterns
        : botDefaults
  }
}

/**
 * Determines if a branch matches bot patterns based on configuration
 */
function isBotBranch(branchName: string, config: Config): boolean {
  // Never consider protected branches as bot branches
  if (protectedBranches.includes(branchName)) {
    return false
  }

  const { patterns } = getBotBranchConfig(config)

  // Convert patterns to regex and test
  return patterns.some(pattern => {
    const regex = globToRegex(pattern)
    return regex.test(branchName)
  })
}

/**
 * Determines if a branch should be skipped for creation based on bot branch strategy
 */
function shouldSkipBranchCreation(branchName: string, config: Config): boolean {
  if (!isBotBranch(branchName, config)) {
    return false // Not a bot branch, don't skip
  }

  const { strategy } = getBotBranchConfig(config)

  // For bot branches, skip creation based on strategy
  return strategy === 'skip' || strategy === 'delete-orphaned'
}

/**
 * Determines if a branch should be updated based on commit timestamps
 */
function shouldUpdateBranch(
  sourceBranch: Branch,
  targetBranch: Branch
): { update: boolean; reason: string } {
  // If we don't have timestamp information, fall back to SHA comparison
  if (!sourceBranch.lastCommitDate || !targetBranch.lastCommitDate) {
    return {
      update: true,
      reason:
        'No timestamp information available, updating based on SHA difference'
    }
  }

  const sourceDate = new Date(sourceBranch.lastCommitDate).getTime()
  const targetDate = new Date(targetBranch.lastCommitDate).getTime()

  // Only update if source commit is newer than target commit
  if (sourceDate > targetDate) {
    const timeDiff = Math.round((sourceDate - targetDate) / 1000 / 60) // minutes
    return {
      update: true,
      reason: `Source commit is ${timeDiff} minutes newer`
    }
  } else if (sourceDate < targetDate) {
    const timeDiff = Math.round((targetDate - sourceDate) / 1000 / 60) // minutes
    return {
      update: false,
      reason: `Target commit is ${timeDiff} minutes newer, skipping to prevent reversion`
    }
  } else {
    return {
      update: false,
      reason:
        'Commits have same timestamp but different SHAs, skipping to be safe'
    }
  }
}

export function compareBranches(
  sourceBranches: Branch[],
  targetBranches: Branch[],
  config: Config
): BranchComparison[] {
  const comparisons: BranchComparison[] = []

  for (const sourceBranch of sourceBranches) {
    const targetBranch = targetBranches.find(b => b.name === sourceBranch.name)

    if (!targetBranch) {
      // Branch doesn't exist in target - check if it should be created
      // Skip creating branches that look like they were deleted (e.g., PR branches)
      if (shouldSkipBranchCreation(sourceBranch.name, config)) {
        comparisons.push({
          name: sourceBranch.name,
          sourceCommit: sourceBranch.sha,
          sourceCommitDate: sourceBranch.lastCommitDate,
          action: 'skip',
          protected: sourceBranch.protected,
          reason: 'Branch appears to be a deleted PR/MR branch'
        })
        core.debug(
          `Branch ${sourceBranch.name} skipped - appears to be deleted PR/MR branch`
        )
        continue
      }

      comparisons.push({
        name: sourceBranch.name,
        sourceCommit: sourceBranch.sha,
        sourceCommitDate: sourceBranch.lastCommitDate,
        action: 'create',
        protected: sourceBranch.protected,
        reason: 'Branch does not exist in target'
      })
      core.debug(`Branch ${sourceBranch.name} will be created in target`)
      continue
    }

    // Branch exists - check if it needs updating using timestamp comparison
    if (sourceBranch.sha !== targetBranch.sha) {
      const shouldUpdate = shouldUpdateBranch(sourceBranch, targetBranch)

      if (shouldUpdate.update) {
        comparisons.push({
          name: sourceBranch.name,
          sourceCommit: sourceBranch.sha,
          targetCommit: targetBranch.sha,
          sourceCommitDate: sourceBranch.lastCommitDate,
          targetCommitDate: targetBranch.lastCommitDate,
          action: 'update',
          protected: sourceBranch.protected,
          reason: shouldUpdate.reason
        })
        core.debug(
          `Branch ${sourceBranch.name} will be updated in target: ${shouldUpdate.reason}`
        )
      } else {
        comparisons.push({
          name: sourceBranch.name,
          sourceCommit: sourceBranch.sha,
          targetCommit: targetBranch.sha,
          sourceCommitDate: sourceBranch.lastCommitDate,
          targetCommitDate: targetBranch.lastCommitDate,
          action: 'skip',
          protected: sourceBranch.protected,
          reason: shouldUpdate.reason
        })
        core.debug(
          `Branch ${sourceBranch.name} skipped: ${shouldUpdate.reason}`
        )
      }
    } else {
      comparisons.push({
        name: sourceBranch.name,
        sourceCommit: sourceBranch.sha,
        targetCommit: targetBranch.sha,
        sourceCommitDate: sourceBranch.lastCommitDate,
        targetCommitDate: targetBranch.lastCommitDate,
        action: 'skip',
        protected: sourceBranch.protected,
        reason: 'Commits are identical'
      })
      core.debug(`Branch ${sourceBranch.name} is up to date`)
    }
  }

  return comparisons
}

/**
 * Unified branch representation for bidirectional sync
 */
interface UnifiedBranch {
  name: string
  githubBranch?: Branch
  gitlabBranch?: Branch
  existsInGithub: boolean
  existsInGitlab: boolean
}

/**
 * Creates a unified view of branches from both repositories
 */
function createUnifiedBranchView(
  githubBranches: Branch[],
  gitlabBranches: Branch[]
): UnifiedBranch[] {
  const branchMap = new Map<string, UnifiedBranch>()

  // Add GitHub branches
  for (const branch of githubBranches) {
    branchMap.set(branch.name, {
      name: branch.name,
      githubBranch: branch,
      existsInGithub: true,
      existsInGitlab: false
    })
  }

  // Add GitLab branches
  for (const branch of gitlabBranches) {
    const existing = branchMap.get(branch.name)
    if (existing) {
      existing.gitlabBranch = branch
      existing.existsInGitlab = true
    } else {
      branchMap.set(branch.name, {
        name: branch.name,
        gitlabBranch: branch,
        existsInGithub: false,
        existsInGitlab: true
      })
    }
  }

  return Array.from(branchMap.values())
}

/**
 * Determines the best sync action for a branch in bidirectional sync
 */
function determineBidirectionalAction(
  branch: UnifiedBranch,
  config: Config
): {
  branch: string
  action: 'sync-to-github' | 'sync-to-gitlab' | 'delete-from-gitlab' | 'skip'
  reason: string
  sourceCommit: string
  targetCommit?: string
} {
  // Branch exists in both repositories
  if (branch.existsInGithub && branch.existsInGitlab) {
    const githubBranch = branch.githubBranch!
    const gitlabBranch = branch.gitlabBranch!

    // Same commit - no sync needed
    if (githubBranch.sha === gitlabBranch.sha) {
      return {
        branch: branch.name,
        action: 'skip',
        reason: 'Commits are identical',
        sourceCommit: githubBranch.sha,
        targetCommit: gitlabBranch.sha
      }
    }

    // Use timestamp comparison to determine direction
    const result = shouldUpdateBranch(githubBranch, gitlabBranch)
    if (result.update) {
      return {
        branch: branch.name,
        action: 'sync-to-gitlab',
        reason: `GitHub is newer: ${result.reason}`,
        sourceCommit: githubBranch.sha,
        targetCommit: gitlabBranch.sha
      }
    }

    const reverseResult = shouldUpdateBranch(gitlabBranch, githubBranch)
    if (reverseResult.update) {
      return {
        branch: branch.name,
        action: 'sync-to-github',
        reason: `GitLab is newer: ${reverseResult.reason}`,
        sourceCommit: gitlabBranch.sha,
        targetCommit: githubBranch.sha
      }
    }

    return {
      branch: branch.name,
      action: 'skip',
      reason: 'Unable to determine which commit is newer',
      sourceCommit: githubBranch.sha,
      targetCommit: gitlabBranch.sha
    }
  }

  // Branch only exists in GitHub
  if (branch.existsInGithub && !branch.existsInGitlab) {
    const githubBranch = branch.githubBranch!

    if (shouldSkipBranchCreation(branch.name, config)) {
      return {
        branch: branch.name,
        action: 'skip',
        reason: 'Branch appears to be a deleted PR/MR branch',
        sourceCommit: githubBranch.sha
      }
    }

    return {
      branch: branch.name,
      action: 'sync-to-gitlab',
      reason: 'Branch only exists in GitHub',
      sourceCommit: githubBranch.sha
    }
  }

  // Branch only exists in GitLab
  if (!branch.existsInGithub && branch.existsInGitlab) {
    const gitlabBranch = branch.gitlabBranch!

    // For bot branches that exist only in GitLab, handle based on strategy
    if (isBotBranch(branch.name, config)) {
      const { strategy } = getBotBranchConfig(config)

      if (strategy === 'delete-orphaned') {
        return {
          branch: branch.name,
          action: 'delete-from-gitlab',
          reason: 'Bot branch exists only in GitLab, deleting orphaned branch',
          sourceCommit: gitlabBranch.sha
        }
      } else if (strategy === 'skip') {
        return {
          branch: branch.name,
          action: 'skip',
          reason:
            'Bot branch exists only in GitLab, skipping per configuration',
          sourceCommit: gitlabBranch.sha
        }
      }
      // If strategy is 'sync', fall through to sync logic below
    }

    // For regular branches, sync them back to GitHub
    return {
      branch: branch.name,
      action: 'sync-to-github',
      reason: 'Branch only exists in GitLab',
      sourceCommit: gitlabBranch.sha
    }
  }

  // This should never happen
  return {
    branch: branch.name,
    action: 'skip',
    reason: 'Branch exists in neither repository (unexpected)',
    sourceCommit: ''
  }
}

/**
 * Logs the bidirectional sync plan
 */
function logBidirectionalSyncPlan(
  syncActions: Array<{
    branch: string
    action: 'sync-to-github' | 'sync-to-gitlab' | 'delete-from-gitlab' | 'skip'
    reason: string
    sourceCommit: string
    targetCommit?: string
  }>
): void {
  const toGithub = syncActions.filter(a => a.action === 'sync-to-github').length
  const toGitlab = syncActions.filter(a => a.action === 'sync-to-gitlab').length
  const deleteFromGitlab = syncActions.filter(
    a => a.action === 'delete-from-gitlab'
  ).length
  const skipped = syncActions.filter(a => a.action === 'skip').length

  core.info(`📊 Bidirectional Sync Plan:`)
  if (toGithub > 0) core.info(`  → GitHub: ${toGithub} branches`)
  if (toGitlab > 0) core.info(`  → GitLab: ${toGitlab} branches`)
  if (deleteFromGitlab > 0)
    core.info(`  🗑️ Delete from GitLab: ${deleteFromGitlab} branches`)
  if (skipped > 0) core.info(`  ⏭️ Skipped: ${skipped} branches`)

  // Log detailed actions
  core.startGroup('🔍 Detailed Sync Actions')
  for (const action of syncActions) {
    if (action.action !== 'skip') {
      let direction: string
      if (action.action === 'sync-to-github') {
        direction = 'GitLab → GitHub'
      } else if (action.action === 'sync-to-gitlab') {
        direction = 'GitHub → GitLab'
      } else if (action.action === 'delete-from-gitlab') {
        direction = '🗑️ Delete from GitLab'
      } else {
        direction = 'Unknown'
      }

      core.info(`${action.branch}: ${direction}`)
      core.info(`  Commit: ${action.sourceCommit.substring(0, 8)}`)
      core.info(`  Reason: ${action.reason}`)
    }
  }
  core.endGroup()
}

/**
 * Executes the bidirectional sync actions
 */
async function executeBidirectionalSync(
  syncActions: Array<{
    branch: string
    action: 'sync-to-github' | 'sync-to-gitlab' | 'delete-from-gitlab' | 'skip'
    reason: string
    sourceCommit: string
    targetCommit?: string
  }>,
  githubClient: GitHubClient,
  gitlabClient: GitLabClient
): Promise<void> {
  const actionsToProcess = syncActions.filter(a => a.action !== 'skip')

  if (actionsToProcess.length === 0) {
    core.info('✅ All branches are already in sync')
    return
  }

  core.startGroup('🔄 Executing Sync Actions')

  // Process actions in parallel with controlled concurrency
  const BATCH_SIZE = 3 // Process 3 branches at a time for bidirectional sync
  const batches = []
  for (let i = 0; i < actionsToProcess.length; i += BATCH_SIZE) {
    batches.push(actionsToProcess.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async action => {
        try {
          if (action.action === 'sync-to-github') {
            core.info(`🔄 Syncing ${action.branch} to GitHub`)
            await githubClient.updateBranch(action.branch, action.sourceCommit)
            core.info(`✅ Synced ${action.branch} to GitHub`)
          } else if (action.action === 'sync-to-gitlab') {
            core.info(`🔄 Syncing ${action.branch} to GitLab`)
            await gitlabClient.updateBranch(action.branch, action.sourceCommit)
            core.info(`✅ Synced ${action.branch} to GitLab`)
          } else if (action.action === 'delete-from-gitlab') {
            core.info(`🗑️ Deleting ${action.branch} from GitLab`)
            await gitlabClient.deleteBranch(action.branch)
            core.info(`✅ Deleted ${action.branch} from GitLab`)
          }
          return { branch: action.branch, status: 'success' }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          core.warning(`Failed to sync ${action.branch}: ${errorMessage}`)
          return {
            branch: action.branch,
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
        `✓ Batch completed: ${successful.length} branches synced successfully`
      )
    }
    if (failed.length > 0) {
      core.warning(`⚠️ Batch issues: ${failed.length} branches failed to sync`)
    }
  }

  core.endGroup()
}

/**
 * Improved bidirectional sync that avoids race conditions by fetching fresh data
 * and using intelligent merge logic
 */
export async function syncBranchesBidirectional(
  githubClient: GitHubClient,
  gitlabClient: GitLabClient
): Promise<void> {
  const config = githubClient.config // Use GitHub client's config
  core.info('🔄 Starting intelligent bidirectional branch sync...')

  // Fetch branches from both repositories simultaneously
  const [githubBranches, gitlabBranches] = await Promise.all([
    githubClient.fetchBranches({
      includeProtected: githubClient.config.github.sync?.branches.protected,
      pattern: githubClient.config.github.sync?.branches.pattern
    }),
    gitlabClient.fetchBranches({
      includeProtected: gitlabClient.config.gitlab.sync?.branches.protected,
      pattern: gitlabClient.config.gitlab.sync?.branches.pattern
    })
  ])

  // Create a unified view of all branches with their latest state
  const unifiedBranches = createUnifiedBranchView(
    githubBranches,
    gitlabBranches
  )

  core.info(
    `🔍 Unified Branch Analysis: ${unifiedBranches.length} unique branches found`
  )

  // Process each branch with intelligent sync logic
  const syncActions: Array<{
    branch: string
    action: 'sync-to-github' | 'sync-to-gitlab' | 'delete-from-gitlab' | 'skip'
    reason: string
    sourceCommit: string
    targetCommit?: string
  }> = []

  for (const branch of unifiedBranches) {
    const action = determineBidirectionalAction(branch, config)
    syncActions.push(action)
  }

  // Log sync plan
  logBidirectionalSyncPlan(syncActions)

  // Execute sync actions
  await executeBidirectionalSync(syncActions, githubClient, gitlabClient)

  core.info('✅ Bidirectional branch sync completed')
}

export async function syncBranches(
  source: GitHubClient | GitLabClient,
  target: GitHubClient | GitLabClient
): Promise<void> {
  const config = source.config // Use source client's config
  // Fetch branches from both repositories
  const sourceBranches = await source.fetchBranches({
    includeProtected: source.config.github.sync?.branches.protected,
    pattern: source.config.github.sync?.branches.pattern
  })

  const targetBranches = await target.fetchBranches()

  // Compare branches and determine required actions
  const branchComparisons = compareBranches(
    sourceBranches,
    targetBranches,
    config
  )

  // Log sync plan with enhanced details
  core.info('\n🔍 Branch Sync Analysis:')
  logSyncPlan(branchComparisons)

  // Process branches in parallel with controlled concurrency
  const actionsToProcess = branchComparisons.filter(c => c.action !== 'skip')

  if (actionsToProcess.length === 0) {
    core.info('✅ All branches are already in sync')
    return
  }

  // Group detailed operations under collapsible section
  core.startGroup('🔄 Branch Operations')

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
              core.info(`🆕 Creating: ${comparison.name}`)
              await createBranch(target, comparison)
              return {
                name: comparison.name,
                action: 'create',
                status: 'success'
              }
            case 'update':
              core.info(`🔄 Updating: ${comparison.name}`)
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

  core.endGroup()
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
  const totalActions = create + update

  if (totalActions === 0) {
    core.info(`✅ All branches are already in sync (${skip} branches checked)`)
    return
  }

  // Log what we're actually doing
  const actions: string[] = []
  if (create > 0) actions.push(`Create ${create} branches`)
  if (update > 0) actions.push(`Update ${update} branches`)

  core.info(`📊 Branch Sync Plan: ${actions.join(', ')}`)

  // Log detailed reasons for debugging
  core.startGroup('🔍 Detailed Branch Analysis')
  for (const comparison of comparisons) {
    if (comparison.action !== 'skip') {
      const sourceDate = comparison.sourceCommitDate
        ? new Date(comparison.sourceCommitDate).toISOString()
        : 'unknown'
      const targetDate = comparison.targetCommitDate
        ? new Date(comparison.targetCommitDate).toISOString()
        : 'N/A'
      core.info(`${comparison.action.toUpperCase()}: ${comparison.name}`)
      core.info(
        `  Source: ${comparison.sourceCommit.substring(0, 8)} (${sourceDate})`
      )
      if (comparison.targetCommit) {
        core.info(
          `  Target: ${comparison.targetCommit.substring(0, 8)} (${targetDate})`
        )
      }
      core.info(`  Reason: ${comparison.reason}`)
    }
  }
  core.endGroup()
}
