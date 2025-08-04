import { Comment, Config } from '../types';
import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
export interface CommentSyncOptions {
    enabled: boolean;
    attribution: {
        includeAuthor: boolean;
        includeTimestamp: boolean;
        includeSourceLink: boolean;
        format: 'quoted' | 'inline' | 'minimal';
    };
    handleUpdates: boolean;
    preserveFormatting: boolean;
    syncReplies: boolean;
}
export declare class CommentFormatter {
    /**
     * Format a comment with proper attribution for synchronization
     */
    static formatSyncedComment(comment: Comment, sourceClient: GitHubClient | GitLabClient, issueNumber: number, options: CommentSyncOptions): string;
    /**
     * Format comment in quoted style (default)
     */
    private static formatQuotedComment;
    /**
     * Format comment in inline style
     */
    private static formatInlineComment;
    /**
     * Format comment in minimal style
     */
    private static formatMinimalComment;
    /**
     * Preserve markdown formatting in comments
     */
    private static preserveMarkdownFormatting;
    /**
     * Generate source URL for a comment
     */
    static generateCommentSourceUrl(sourceClient: GitHubClient | GitLabClient, issueNumber: number, commentId: number): string;
    /**
     * Check if a comment is already synced (to avoid duplicates)
     */
    static isCommentSynced(commentBody: string): boolean;
    /**
     * Extract original comment ID from synced comment
     */
    static extractOriginalCommentId(commentBody: string): number | null;
    /**
     * Compare comments to determine if update is needed
     */
    static needsCommentUpdate(sourceComment: Comment, targetComment: Comment): boolean;
    /**
     * Extract original comment body from synced comment
     */
    private static extractOriginalBody;
}
/**
 * Helper to get comment sync options from config
 */
export declare function getCommentSyncOptions(config: Config, type: 'issues' | 'pullRequests'): CommentSyncOptions;
