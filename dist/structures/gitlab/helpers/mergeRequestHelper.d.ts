import { PullRequest, Config } from '@/src/types';
export declare class mergeRequestHelper {
    private gitlab;
    private config;
    private getProjectId;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    syncPullRequests(): Promise<PullRequest[]>;
    createPullRequest(pr: PullRequest): Promise<void>;
    updatePullRequest(number: number, pr: PullRequest): Promise<void>;
    closePullRequest(number: number): Promise<void>;
}
