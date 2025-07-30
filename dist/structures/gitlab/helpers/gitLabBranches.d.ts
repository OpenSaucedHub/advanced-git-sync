import { Branch, Config, BranchFilterOptions } from '@/src/types';
export declare class gitlabBranchHelper {
    private gitlab;
    private config;
    private getProjectId;
    private repoPath;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    private getRepoPathFromConfig;
    fetch(filterOptions?: BranchFilterOptions): Promise<Branch[]>;
    update(name: string, commitSha: string): Promise<void>;
    create(name: string, commitSha: string): Promise<void>;
}
