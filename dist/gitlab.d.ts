import { Config } from './types';
import { Branch, PullRequest, Issue, Release, Comment } from './types';
export declare class GitLabClient {
    private gitlab;
    private config;
    private repo;
    constructor(config: Config);
    private get projectPath();
    syncBranches(): Promise<Branch[]>;
    syncPullRequests(): Promise<PullRequest[]>;
    syncIssues(): Promise<Issue[]>;
    getIssueComments(issueNumber: number): Promise<Comment[]>;
    syncReleases(): Promise<Release[]>;
    syncTags(): Promise<string[]>;
}
