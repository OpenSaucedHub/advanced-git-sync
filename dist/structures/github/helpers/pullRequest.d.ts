import { Repository, Config, PullRequest } from '@/src/types';
export declare class pullRequestHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    syncPullRequests(): Promise<PullRequest[]>;
    createPullRequest(pr: PullRequest): Promise<void>;
    updatePullRequest(number: number, pr: PullRequest): Promise<void>;
    closePullRequest(number: number): Promise<void>;
}
