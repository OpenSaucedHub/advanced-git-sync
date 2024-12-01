import { Issue, Comment, Config, Repository } from '@/src/types';
export declare class IssueHelper {
    private gitlab;
    private repo;
    private config;
    constructor(gitlab: any, repo: Repository, config: Config);
    private get projectPath();
    syncIssues(): Promise<Issue[]>;
    getIssueComments(issueNumber: number): Promise<Comment[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
    createIssueComment(issueNumber: number, comment: Comment): Promise<void>;
}
