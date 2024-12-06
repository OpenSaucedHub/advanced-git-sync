import { Repository, Config, Issue, Comment } from '@/src/types';
export declare class githubIssueHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    syncIssues(): Promise<Issue[]>;
    private processLabels;
    getIssueComments(issueNumber: number): Promise<Comment[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
    createIssueComment(issueNumber: number, comment: Comment): Promise<void>;
}
