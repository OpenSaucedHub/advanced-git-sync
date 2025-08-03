import { Repository, Config, Issue } from '@/src/types';
export declare class githubIssueHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    syncIssues(): Promise<Issue[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
}
