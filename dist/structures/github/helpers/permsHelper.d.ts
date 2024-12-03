import { Config, Repository } from '@/src/types';
export declare class permsHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    validateAccess(): Promise<void>;
}
