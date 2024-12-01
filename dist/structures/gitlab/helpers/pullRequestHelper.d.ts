import { PullRequest, Config, Repository } from '@/src/types';
export declare class PullRequestHelper {
    private gitlab;
    private repo;
    private config;
    constructor(gitlab: any, repo: Repository, config: Config);
    private get projectPath();
    syncPullRequests(): Promise<PullRequest[]>;
    createPullRequest(pr: PullRequest): Promise<void>;
    updatePullRequest(number: number, pr: PullRequest): Promise<void>;
    closePullRequest(number: number): Promise<void>;
}
