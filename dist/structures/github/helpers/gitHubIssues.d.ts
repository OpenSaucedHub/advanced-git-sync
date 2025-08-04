import { Repository, Config, Issue, Comment } from '@/src/types';
export declare class githubIssueHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    syncIssues(): Promise<Issue[]>;
    /**
     * Fetch comments for a specific issue
     */
    fetchIssueComments(issueNumber: number): Promise<Comment[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
    /**
     * Create a comment on an issue
     */
    createIssueComment(issueNumber: number, body: string): Promise<void>;
    /**
     * Update a comment on an issue
     */
    updateIssueComment(commentId: number, body: string): Promise<void>;
}
