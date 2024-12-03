import { Config, Repository } from '@/src/types';
export declare class permsHelper {
    private gitlab;
    private repo;
    private config;
    private getProjectId;
    constructor(gitlab: any, repo: Repository, config: Config, projectIdGetter: () => Promise<number>);
    validateAccess(): Promise<void>;
}
