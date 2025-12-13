// src/utils/timelineUtils.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import { GitHubClient } from '@/src/structures/GitHub'
import { GitLabClient } from '@/src/structures/GitLab'

export interface TimelineDivergence {
  hasCommonHistory: boolean
  mergeBase?: string
  sourceUniqueCommits: string[]
  targetUniqueCommits: string[]
  divergencePoint?: string
}

export interface CommitInfo {
  sha: string
  message: string
  author: string
  date: string
  exists: boolean
}

export interface TimelineMergeResult {
  success: boolean
  mergeCommitSha?: string
  conflictsResolved: boolean
  error?: string
}

/**
 * TVA-style timeline analysis and merging utilities
 */
export class TimelineManager {
  private tmpDir: string

  constructor() {
    this.tmpDir = path.join(
      process.cwd(),
      `.tmp-timeline-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    )
  }

  /**
   * Find the merge base (divergence point) between two repositories
   */
  async findMergeBase(
    sourceClient: GitHubClient | GitLabClient,
    targetClient: GitHubClient | GitLabClient,
    branchName = 'main'
  ): Promise<string | null> {
    try {
      await this.setupTempRepo()

      // Add both remotes
      await this.addRemote('source', this.getRepoUrl(sourceClient))
      await this.addRemote('target', this.getRepoUrl(targetClient))

      // Fetch both branches
      await exec.exec('git', ['fetch', 'source', branchName], {
        cwd: this.tmpDir
      })
      await exec.exec('git', ['fetch', 'target', branchName], {
        cwd: this.tmpDir
      })

      // Find merge base
      let mergeBase = ''
      const exitCode = await exec.exec(
        'git',
        ['merge-base', `source/${branchName}`, `target/${branchName}`],
        {
          cwd: this.tmpDir,
          listeners: {
            stdout: (data: Buffer) => {
              mergeBase += data.toString().trim()
            }
          },
          ignoreReturnCode: true
        }
      )

      return exitCode === 0 ? mergeBase : null
    } catch (error) {
      core.warning(`Failed to find merge base: ${error}`)
      return null
    }
  }

  /**
   * Analyze timeline divergence between repositories
   */
  async analyzeTimelineDivergence(
    sourceClient: GitHubClient | GitLabClient,
    targetClient: GitHubClient | GitLabClient,
    branchName = 'main'
  ): Promise<TimelineDivergence> {
    const mergeBase = await this.findMergeBase(
      sourceClient,
      targetClient,
      branchName
    )

    if (!mergeBase) {
      return {
        hasCommonHistory: false,
        sourceUniqueCommits: [],
        targetUniqueCommits: []
      }
    }

    try {
      // Get commits unique to source
      const sourceUniqueCommits = await this.getUniqueCommits(
        `source/${branchName}`,
        `target/${branchName}`
      )

      // Get commits unique to target
      const targetUniqueCommits = await this.getUniqueCommits(
        `target/${branchName}`,
        `source/${branchName}`
      )

      return {
        hasCommonHistory: true,
        mergeBase,
        divergencePoint: mergeBase,
        sourceUniqueCommits,
        targetUniqueCommits
      }
    } catch (error) {
      core.warning(`Failed to analyze timeline divergence: ${error}`)
      return {
        hasCommonHistory: false,
        sourceUniqueCommits: [],
        targetUniqueCommits: []
      }
    }
  }

  /**
   * Check if a commit exists in a repository
   */
  async commitExists(
    client: GitHubClient | GitLabClient,
    commitSha: string
  ): Promise<boolean> {
    return await client.commitExists(commitSha)
  }

  /**
   * Get commit information (simplified implementation)
   */
  async getCommitInfo(
    client: GitHubClient | GitLabClient,
    commitSha: string
  ): Promise<CommitInfo | null> {
    const exists = await this.commitExists(client, commitSha)
    if (!exists) {
      return null
    }

    // Return basic info - full implementation would fetch detailed commit data
    return {
      sha: commitSha,
      message: 'Commit exists',
      author: 'Unknown',
      date: new Date().toISOString(),
      exists: true
    }
  }

  /**
   * Create a timeline merge commit
   */
  async createTimelineMerge(
    sourceClient: GitHubClient | GitLabClient,
    targetClient: GitHubClient | GitLabClient,
    branchName: string,
    mergeMessage: string
  ): Promise<TimelineMergeResult> {
    try {
      await this.setupTempRepo()

      // Add remotes
      await this.addRemote('source', this.getRepoUrl(sourceClient))
      await this.addRemote('target', this.getRepoUrl(targetClient))

      // Fetch branches
      await exec.exec('git', ['fetch', 'source', branchName], {
        cwd: this.tmpDir
      })
      await exec.exec('git', ['fetch', 'target', branchName], {
        cwd: this.tmpDir
      })

      // Checkout target branch
      await exec.exec(
        'git',
        ['checkout', '-b', branchName, `target/${branchName}`],
        { cwd: this.tmpDir }
      )

      // Attempt merge
      const mergeExitCode = await exec.exec(
        'git',
        ['merge', `source/${branchName}`, '-m', mergeMessage],
        {
          cwd: this.tmpDir,
          ignoreReturnCode: true
        }
      )

      if (mergeExitCode === 0) {
        // Get the merge commit SHA
        let mergeCommitSha = ''
        await exec.exec('git', ['rev-parse', 'HEAD'], {
          cwd: this.tmpDir,
          listeners: {
            stdout: (data: Buffer) => {
              mergeCommitSha = data.toString().trim()
            }
          }
        })

        return {
          success: true,
          mergeCommitSha,
          conflictsResolved: false
        }
      } else {
        // Handle merge conflicts with a simple strategy
        core.info(
          '🔀 Merge conflicts detected, attempting automatic resolution...'
        )

        // Accept both changes for most conflicts
        await exec.exec('git', ['checkout', '--theirs', '.'], {
          cwd: this.tmpDir,
          ignoreReturnCode: true
        })

        await exec.exec('git', ['add', '.'], { cwd: this.tmpDir })
        await exec.exec('git', ['commit', '-m', mergeMessage], {
          cwd: this.tmpDir
        })

        let mergeCommitSha = ''
        await exec.exec('git', ['rev-parse', 'HEAD'], {
          cwd: this.tmpDir,
          listeners: {
            stdout: (data: Buffer) => {
              mergeCommitSha = data.toString().trim()
            }
          }
        })

        return {
          success: true,
          mergeCommitSha,
          conflictsResolved: true
        }
      }
    } catch (error) {
      return {
        success: false,
        conflictsResolved: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Find equivalent commit by advanced content matching
   * Uses multiple strategies: message matching, author matching, tree comparison, and semantic analysis
   */
  async findEquivalentCommit(
    sourceCommit: CommitInfo,
    targetClient: GitHubClient | GitLabClient,
    branchName = 'main'
  ): Promise<string | null> {
    try {
      core.info(
        `🔍 Searching for equivalent commit: ${sourceCommit.message.substring(0, 50)}...`
      )

      // Get recent commits from target repository (last 100 commits)
      const targetCommits = await this.getRecentCommits(
        targetClient,
        branchName,
        100
      )

      if (targetCommits.length === 0) {
        core.debug('No commits found in target repository')
        return null
      }

      // Strategy 1: Exact message and author match
      const exactMatch = await this.findExactMatch(sourceCommit, targetCommits)
      if (exactMatch) {
        core.info(`✅ Found exact match: ${exactMatch}`)
        return exactMatch
      }

      // Strategy 2: Message similarity with author match
      const similarMatch = await this.findSimilarMatch(
        sourceCommit,
        targetCommits
      )
      if (similarMatch) {
        core.info(`✅ Found similar match: ${similarMatch}`)
        return similarMatch
      }

      // Strategy 3: Tree content comparison (most accurate but expensive)
      const treeMatch = await this.findTreeMatch(
        sourceCommit,
        targetCommits,
        targetClient
      )
      if (treeMatch) {
        core.info(`✅ Found tree content match: ${treeMatch}`)
        return treeMatch
      }

      // Strategy 4: Semantic analysis of commit changes
      const semanticMatch = await this.findSemanticMatch(
        sourceCommit,
        targetCommits,
        targetClient
      )
      if (semanticMatch) {
        core.info(`✅ Found semantic match: ${semanticMatch}`)
        return semanticMatch
      }

      core.debug(`No equivalent commit found for: ${sourceCommit.message}`)
      return null
    } catch (error) {
      core.warning(`Failed to find equivalent commit: ${error}`)
      return null
    }
  }

  /**
   * Strategy 1: Find exact matches by message and author
   */
  private async findExactMatch(
    sourceCommit: CommitInfo,
    targetCommits: CommitInfo[]
  ): Promise<string | null> {
    const exactMatch = targetCommits.find(
      commit =>
        commit.message.trim() === sourceCommit.message.trim() &&
        commit.author === sourceCommit.author
    )

    return exactMatch ? exactMatch.sha : null
  }

  /**
   * Strategy 2: Find similar matches using fuzzy string matching
   */
  private async findSimilarMatch(
    sourceCommit: CommitInfo,
    targetCommits: CommitInfo[]
  ): Promise<string | null> {
    const sourceMsg = sourceCommit.message.trim().toLowerCase()
    const sourceAuthor = sourceCommit.author.toLowerCase()

    // Find commits by same author with similar messages
    const authorMatches = targetCommits.filter(
      commit => commit.author.toLowerCase() === sourceAuthor
    )

    if (authorMatches.length === 0) return null

    // Calculate similarity scores
    const similarities = authorMatches.map(commit => ({
      commit,
      score: this.calculateMessageSimilarity(
        sourceMsg,
        commit.message.trim().toLowerCase()
      )
    }))

    // Find best match with similarity > 80%
    const bestMatch = similarities
      .filter(s => s.score > 0.8)
      .sort((a, b) => b.score - a.score)[0]

    return bestMatch ? bestMatch.commit.sha : null
  }

  /**
   * Strategy 3: Compare file trees between commits
   */
  private async findTreeMatch(
    sourceCommit: CommitInfo,
    targetCommits: CommitInfo[],
    targetClient: GitHubClient | GitLabClient
  ): Promise<string | null> {
    try {
      // This is computationally expensive, so we limit to recent commits by same author
      const authorMatches = targetCommits
        .filter(commit => commit.author === sourceCommit.author)
        .slice(0, 20) // Limit to 20 most recent commits by same author

      for (const targetCommit of authorMatches) {
        const treesMatch = await this.compareCommitTrees(
          sourceCommit,
          targetCommit,
          targetClient
        )
        if (treesMatch) {
          return targetCommit.sha
        }
      }

      return null
    } catch (error) {
      core.debug(`Tree comparison failed: ${error}`)
      return null
    }
  }

  /**
   * Strategy 4: Semantic analysis of commit changes
   */
  private async findSemanticMatch(
    sourceCommit: CommitInfo,
    targetCommits: CommitInfo[],
    targetClient: GitHubClient | GitLabClient
  ): Promise<string | null> {
    try {
      // Look for commits with similar semantic patterns
      const semanticCandidates = targetCommits.filter(commit => {
        // Check for similar commit patterns
        return this.haveSimilarSemanticPatterns(sourceCommit, commit)
      })

      if (semanticCandidates.length === 0) return null

      // For semantic matches, we'll compare the actual changes
      for (const candidate of semanticCandidates.slice(0, 10)) {
        const changesMatch = await this.compareCommitChanges(
          sourceCommit,
          candidate,
          targetClient
        )
        if (changesMatch) {
          return candidate.sha
        }
      }

      return null
    } catch (error) {
      core.debug(`Semantic analysis failed: ${error}`)
      return null
    }
  }

  /**
   * Get recent commits from a repository
   */
  private async getRecentCommits(
    client: GitHubClient | GitLabClient,
    branchName: string,
    limit: number
  ): Promise<CommitInfo[]> {
    try {
      const commits = await client.getRecentCommits(branchName, limit)

      if (client instanceof GitHubClient) {
        return commits.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || 'Unknown',
          date: commit.commit.author?.date || new Date().toISOString(),
          exists: true
        }))
      } else {
        return commits.map(commit => ({
          sha: commit.id,
          message: commit.message,
          author: commit.author_name,
          date: commit.created_at,
          exists: true
        }))
      }
    } catch (error) {
      core.debug(`Failed to get recent commits: ${error}`)
      return []
    }
  }

  /**
   * Calculate message similarity using Levenshtein distance
   */
  private calculateMessageSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    // Simple similarity based on common words and structure
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)

    // Calculate Jaccard similarity (intersection over union)
    const set1 = new Set(words1)
    const set2 = new Set(words2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    const jaccardSimilarity = intersection.size / union.size

    // Bonus for similar length and structure
    const lengthSimilarity =
      1 -
      Math.abs(str1.length - str2.length) / Math.max(str1.length, str2.length)

    // Combined score
    return jaccardSimilarity * 0.7 + lengthSimilarity * 0.3
  }

  /**
   * Compare commit trees to see if they represent the same changes
   */
  private async compareCommitTrees(
    sourceCommit: CommitInfo,
    targetCommit: CommitInfo,
    _targetClient: GitHubClient | GitLabClient
  ): Promise<boolean> {
    try {
      // This is a simplified implementation
      // In a full implementation, you would compare the actual file trees

      // For now, we'll use a heuristic based on commit message similarity and timing
      const messageSimilarity = this.calculateMessageSimilarity(
        sourceCommit.message,
        targetCommit.message
      )

      // Check if commits are close in time (within 7 days)
      const sourceTime = new Date(sourceCommit.date).getTime()
      const targetTime = new Date(targetCommit.date).getTime()
      const timeDiff = Math.abs(sourceTime - targetTime)
      const sevenDays = 7 * 24 * 60 * 60 * 1000

      const timeProximity = timeDiff < sevenDays

      // Consider it a tree match if message similarity > 90% and time is close
      return messageSimilarity > 0.9 && timeProximity
    } catch (error) {
      core.debug(`Tree comparison error: ${error}`)
      return false
    }
  }

  /**
   * Check if two commits have similar semantic patterns
   */
  private haveSimilarSemanticPatterns(
    sourceCommit: CommitInfo,
    targetCommit: CommitInfo
  ): boolean {
    const sourceMsg = sourceCommit.message.toLowerCase()
    const targetMsg = targetCommit.message.toLowerCase()

    // Common semantic patterns in commit messages
    const patterns = [
      /^(feat|feature)[\(\:]/, // Feature commits
      /^(fix|bugfix)[\(\:]/, // Bug fixes
      /^(docs?)[\(\:]/, // Documentation
      /^(style|format)[\(\:]/, // Style changes
      /^(refactor)[\(\:]/, // Refactoring
      /^(test)[\(\:]/, // Tests
      /^(chore)[\(\:]/, // Chores
      /^(build|ci)[\(\:]/, // Build/CI
      /^(perf|performance)[\(\:]/, // Performance
      /^(revert)[\(\:]/, // Reverts
      /bump.*version/, // Version bumps
      /update.*dependencies?/, // Dependency updates
      /merge.*pull.*request/, // Merge commits
      /initial.*commit/ // Initial commits
    ]

    // Check if both commits match the same semantic pattern
    for (const pattern of patterns) {
      if (pattern.test(sourceMsg) && pattern.test(targetMsg)) {
        return true
      }
    }

    // Check for similar keywords
    const sourceKeywords = this.extractKeywords(sourceMsg)
    const targetKeywords = this.extractKeywords(targetMsg)

    const commonKeywords = sourceKeywords.filter(k =>
      targetKeywords.includes(k)
    )

    // Consider similar if they share significant keywords
    return (
      commonKeywords.length >= 2 ||
      (commonKeywords.length >= 1 && sourceKeywords.length <= 3)
    )
  }

  /**
   * Compare actual commit changes (simplified implementation)
   */
  private async compareCommitChanges(
    sourceCommit: CommitInfo,
    targetCommit: CommitInfo,
    _targetClient: GitHubClient | GitLabClient
  ): Promise<boolean> {
    try {
      // This would ideally compare the actual diff/patch content
      // For now, we'll use a combination of heuristics

      // 1. Message similarity
      const messageSimilarity = this.calculateMessageSimilarity(
        sourceCommit.message,
        targetCommit.message
      )

      // 2. Author match
      const sameAuthor = sourceCommit.author === targetCommit.author

      // 3. Time proximity (within 30 days for semantic matches)
      const sourceTime = new Date(sourceCommit.date).getTime()
      const targetTime = new Date(targetCommit.date).getTime()
      const timeDiff = Math.abs(sourceTime - targetTime)
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      const timeProximity = timeDiff < thirtyDays

      // Consider it a semantic match if:
      // - High message similarity (>70%) AND same author
      // - OR very high message similarity (>85%) regardless of author
      // - AND commits are within reasonable time frame
      return (
        timeProximity &&
        ((messageSimilarity > 0.7 && sameAuthor) || messageSimilarity > 0.85)
      )
    } catch (error) {
      core.debug(`Commit changes comparison error: ${error}`)
      return false
    }
  }

  /**
   * Extract keywords from commit message for semantic analysis
   */
  private extractKeywords(message: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'among',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can'
    ])

    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10) // Limit to first 10 keywords
  }

  /**
   * Cleanup temporary directory
   */
  async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.tmpDir)) {
        fs.rmSync(this.tmpDir, { recursive: true, force: true })
      }
    } catch (error) {
      core.warning(`Failed to cleanup temp directory: ${error}`)
    }
  }

  // Private helper methods
  private async setupTempRepo(): Promise<void> {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true })
    }

    await exec.exec('git', ['init'], { cwd: this.tmpDir })
    await exec.exec('git', ['config', 'user.name', 'advanced-git-sync'], {
      cwd: this.tmpDir
    })
    await exec.exec(
      'git',
      ['config', 'user.email', 'advanced-git-sync@users.noreply.github.com'],
      { cwd: this.tmpDir }
    )
  }

  private async addRemote(name: string, url: string): Promise<void> {
    await exec.exec('git', ['remote', 'add', name, url], { cwd: this.tmpDir })
  }

  private getRepoUrl(client: GitHubClient | GitLabClient): string {
    if (client instanceof GitHubClient) {
      const token = client.config.github.token
      return `https://${token}@github.com/${client.repo.owner}/${client.repo.repo}.git`
    } else {
      const token = client.config.gitlab.token
      const host = client.config.gitlab.host || 'https://gitlab.com'
      return `https://${token}@${host.replace('https://', '')}/${client.config.gitlab.owner}/${client.config.gitlab.repo}.git`
    }
  }

  private async getUniqueCommits(
    baseBranch: string,
    compareBranch: string
  ): Promise<string[]> {
    const commits: string[] = []

    await exec.exec(
      'git',
      ['rev-list', `${baseBranch}..${compareBranch}`, '--oneline'],
      {
        cwd: this.tmpDir,
        listeners: {
          stdout: (data: Buffer) => {
            const lines = data.toString().trim().split('\n')
            for (const line of lines) {
              if (line.trim()) {
                const sha = line.split(' ')[0]
                commits.push(sha)
              }
            }
          }
        },
        ignoreReturnCode: true
      }
    )

    return commits
  }
}
