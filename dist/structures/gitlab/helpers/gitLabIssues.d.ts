import { Issue, Config, Comment } from '@/src/types';
export declare class gitlabIssueHelper {
    private gitlab;
    private config;
    private getProjectId;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    syncIssues(): Promise<Issue[]>;
    /**
     * Fetch comments (notes) for a specific issue
     */
    fetchIssueComments(projectId: number, issueIid: number): Promise<Comment[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
    /**
     * Create a comment (note) on an issue
     */
    createIssueComment(issueNumber: number, body: string): Promise<void>;
    /**
     * Update a comment (note) on an issue
     */
    updateIssueComment(issueNumber: number, noteId: number, body: string): Promise<void>;
}
