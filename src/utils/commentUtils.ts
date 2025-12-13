// src/utils/commentUtils.ts
import { Comment, Config } from '../../types'
import { GitHubClient } from '../structures/GitHub'
import { GitLabClient } from '../structures/GitLab'

export interface CommentSyncOptions {
  enabled: boolean
  attribution: {
    includeAuthor: boolean
    includeTimestamp: boolean
    includeSourceLink: boolean
    format: 'quoted' | 'inline' | 'minimal'
  }
  handleUpdates: boolean
  preserveFormatting: boolean
  syncReplies: boolean
}

export class CommentFormatter {
  /**
   * Format a comment with proper attribution for synchronization
   */
  static formatSyncedComment(
    comment: Comment,
    sourceClient: GitHubClient | GitLabClient,
    issueNumber: number,
    options: CommentSyncOptions
  ): string {
    const repoInfo = sourceClient.getRepoInfo()
    const platform = sourceClient instanceof GitHubClient ? 'GitHub' : 'GitLab'

    let formattedComment = ''

    // Add attribution header based on format
    switch (options.attribution.format) {
      case 'quoted':
        formattedComment = this.formatQuotedComment(
          comment,
          repoInfo,
          platform,
          issueNumber,
          options
        )
        break
      case 'inline':
        formattedComment = this.formatInlineComment(
          comment,
          repoInfo,
          platform,
          issueNumber,
          options
        )
        break
      case 'minimal':
        formattedComment = this.formatMinimalComment(
          comment,
          repoInfo,
          platform,
          issueNumber,
          options
        )
        break
    }

    return formattedComment
  }

  /**
   * Format comment in quoted style (default)
   */
  private static formatQuotedComment(
    comment: Comment,
    repoInfo: any,
    platform: string,
    issueNumber: number,
    options: CommentSyncOptions
  ): string {
    let header = `**💬 Comment by @${comment.author || 'unknown'} on ${platform}**`

    if (options.attribution.includeSourceLink && comment.sourceUrl) {
      header += ` ([original](${comment.sourceUrl}))`
    }

    let body = comment.body
    if (options.preserveFormatting) {
      body = this.preserveMarkdownFormatting(body)
    }

    let quotedBody = body
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n')

    let footer = ''
    if (options.attribution.includeTimestamp && comment.createdAt) {
      const date = new Date(comment.createdAt).toISOString().split('T')[0]
      footer = `\n---\n*Synced from ${platform} on ${date}*`
    }

    return `${header}\n\n${quotedBody}${footer}`
  }

  /**
   * Format comment in inline style
   */
  private static formatInlineComment(
    comment: Comment,
    repoInfo: any,
    platform: string,
    issueNumber: number,
    options: CommentSyncOptions
  ): string {
    let prefix = `**@${comment.author || 'unknown'}** (${platform}): `

    if (options.attribution.includeSourceLink && comment.sourceUrl) {
      prefix += `[🔗](${comment.sourceUrl}) `
    }

    let body = comment.body
    if (options.preserveFormatting) {
      body = this.preserveMarkdownFormatting(body)
    }

    return `${prefix}${body}`
  }

  /**
   * Format comment in minimal style
   */
  private static formatMinimalComment(
    comment: Comment,
    repoInfo: any,
    platform: string,
    issueNumber: number,
    options: CommentSyncOptions
  ): string {
    let body = comment.body
    if (options.preserveFormatting) {
      body = this.preserveMarkdownFormatting(body)
    }

    let suffix = ''
    if (options.attribution.includeAuthor) {
      suffix = ` — @${comment.author || 'unknown'}`
    }

    return `${body}${suffix}`
  }

  /**
   * Preserve markdown formatting in comments
   */
  private static preserveMarkdownFormatting(body: string): string {
    // Handle code blocks
    body = body.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\`\`\`${lang || ''}\n${code}\`\`\``
    })

    // Handle inline code
    body = body.replace(/`([^`]+)`/g, '`$1`')

    // Handle links - preserve them as-is
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)')

    // Handle @mentions - convert to plain text to avoid unwanted notifications
    body = body.replace(/@(\w+)/g, '\\@$1')

    // Handle issue/PR references - convert to plain text
    body = body.replace(/#(\d+)/g, '\\#$1')

    return body
  }

  /**
   * Generate source URL for a comment
   */
  static async generateCommentSourceUrl(
    sourceClient: GitHubClient | GitLabClient,
    issueNumber: number,
    commentId: number
  ): Promise<string> {
    const repoInfo = await sourceClient.getRepoInfo()

    if (sourceClient instanceof GitHubClient) {
      return `${repoInfo.url}/issues/${issueNumber}#issuecomment-${commentId}`
    } else {
      // GitLab
      return `${repoInfo.url}/-/issues/${issueNumber}#note_${commentId}`
    }
  }

  /**
   * Check if a comment is already synced (to avoid duplicates)
   */
  static isCommentSynced(commentBody: string): boolean {
    return (
      commentBody.includes('💬 Comment by @') ||
      commentBody.includes('Synced from GitHub') ||
      commentBody.includes('Synced from GitLab')
    )
  }

  /**
   * Extract original comment ID from synced comment
   */
  static extractOriginalCommentId(commentBody: string): number | null {
    const match = commentBody.match(/issuecomment-(\d+)|note_(\d+)/)
    if (match) {
      return parseInt(match[1] || match[2])
    }
    return null
  }

  /**
   * Compare comments to determine if update is needed
   */
  static needsCommentUpdate(
    sourceComment: Comment,
    targetComment: Comment
  ): boolean {
    // Extract the original body from the synced comment
    const targetBody = this.extractOriginalBody(targetComment.body)
    return (
      sourceComment.body !== targetBody ||
      sourceComment.updatedAt !== targetComment.updatedAt
    )
  }

  /**
   * Extract original comment body from synced comment
   */
  private static extractOriginalBody(syncedBody: string): string {
    // For quoted format, extract content between > markers
    if (syncedBody.includes('> ')) {
      const lines = syncedBody.split('\n')
      const quotedLines = lines.filter(line => line.startsWith('> '))
      return quotedLines.map(line => line.substring(2)).join('\n')
    }

    // For inline format, extract content after the prefix
    const inlineMatch = syncedBody.match(/\*\*@\w+\*\* \([^)]+\): (.+)/)
    if (inlineMatch) {
      return inlineMatch[1]
    }

    // For minimal format, extract content before the suffix
    const minimalMatch = syncedBody.match(/(.+) — @\w+$/)
    if (minimalMatch) {
      return minimalMatch[1]
    }

    return syncedBody
  }
}

/**
 * Helper to get comment sync options from config
 */
export function getCommentSyncOptions(
  config: Config,
  type: 'issues' | 'pullRequests'
): CommentSyncOptions {
  const syncConfig =
    type === 'issues'
      ? config.github.sync?.issues || config.gitlab.sync?.issues
      : config.github.sync?.pullRequests || config.gitlab.sync?.pullRequests

  return {
    enabled: syncConfig?.comments?.enabled || false,
    attribution: {
      includeAuthor: syncConfig?.comments?.attribution?.includeAuthor ?? true,
      includeTimestamp:
        syncConfig?.comments?.attribution?.includeTimestamp ?? true,
      includeSourceLink:
        syncConfig?.comments?.attribution?.includeSourceLink ?? true,
      format: syncConfig?.comments?.attribution?.format || 'quoted'
    },
    handleUpdates: syncConfig?.comments?.handleUpdates ?? true,
    preserveFormatting: syncConfig?.comments?.preserveFormatting ?? true,
    syncReplies: syncConfig?.comments?.syncReplies ?? true
  }
}
