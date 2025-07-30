import { Repository, Config, Branch, BranchFilterOptions } from '@src/types';
export declare class githubBranchHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    fetch(filterOptions?: BranchFilterOptions): Promise<Branch[]>;
    update(name: string, commitSha: string): Promise<void>;
    create(name: string, commitSha: string): Promise<void>;
}
