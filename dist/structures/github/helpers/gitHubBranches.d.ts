import { Repository, Config, Branch } from '@src/types';
export declare class githubBranchHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    sync(): Promise<Branch[]>;
    create(name: string, commitSha: string): Promise<void>;
    update(name: string, commitSha: string): Promise<void>;
}
