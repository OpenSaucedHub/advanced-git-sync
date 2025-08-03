import { GitHubClient } from '@src/structures/github/GitHub';
import { GitLabClient } from '@src/structures/gitlab/GitLab';
export interface TimelineDivergence {
    hasCommonHistory: boolean;
    mergeBase?: string;
    sourceUniqueCommits: string[];
    targetUniqueCommits: string[];
    divergencePoint?: string;
}
export interface CommitInfo {
    sha: string;
    message: string;
    author: string;
    date: string;
    exists: boolean;
}
export interface TimelineMergeResult {
    success: boolean;
    mergeCommitSha?: string;
    conflictsResolved: boolean;
    error?: string;
}
/**
 * TVA-style timeline analysis and merging utilities
 */
export declare class TimelineManager {
    private tmpDir;
    constructor();
    /**
     * Find the merge base (divergence point) between two repositories
     */
    findMergeBase(sourceClient: GitHubClient | GitLabClient, targetClient: GitHubClient | GitLabClient, branchName?: string): Promise<string | null>;
    /**
     * Analyze timeline divergence between repositories
     */
    analyzeTimelineDivergence(sourceClient: GitHubClient | GitLabClient, targetClient: GitHubClient | GitLabClient, branchName?: string): Promise<TimelineDivergence>;
    /**
     * Check if a commit exists in a repository
     */
    commitExists(client: GitHubClient | GitLabClient, commitSha: string): Promise<boolean>;
    /**
     * Get commit information (simplified implementation)
     */
    getCommitInfo(client: GitHubClient | GitLabClient, commitSha: string): Promise<CommitInfo | null>;
    /**
     * Create a timeline merge commit
     */
    createTimelineMerge(sourceClient: GitHubClient | GitLabClient, targetClient: GitHubClient | GitLabClient, branchName: string, mergeMessage: string): Promise<TimelineMergeResult>;
    /**
     * Find equivalent commit by advanced content matching
     * Uses multiple strategies: message matching, author matching, tree comparison, and semantic analysis
     */
    findEquivalentCommit(sourceCommit: CommitInfo, targetClient: GitHubClient | GitLabClient, branchName?: string): Promise<string | null>;
    /**
     * Strategy 1: Find exact matches by message and author
     */
    private findExactMatch;
    /**
     * Strategy 2: Find similar matches using fuzzy string matching
     */
    private findSimilarMatch;
    /**
     * Strategy 3: Compare file trees between commits
     */
    private findTreeMatch;
    /**
     * Strategy 4: Semantic analysis of commit changes
     */
    private findSemanticMatch;
    /**
     * Get recent commits from a repository
     */
    private getRecentCommits;
    /**
     * Calculate message similarity using Levenshtein distance
     */
    private calculateMessageSimilarity;
    /**
     * Compare commit trees to see if they represent the same changes
     */
    private compareCommitTrees;
    /**
     * Check if two commits have similar semantic patterns
     */
    private haveSimilarSemanticPatterns;
    /**
     * Compare actual commit changes (simplified implementation)
     */
    private compareCommitChanges;
    /**
     * Extract keywords from commit message for semantic analysis
     */
    private extractKeywords;
    /**
     * Cleanup temporary directory
     */
    cleanup(): Promise<void>;
    private setupTempRepo;
    private addRemote;
    private getRepoUrl;
    private getUniqueCommits;
}
