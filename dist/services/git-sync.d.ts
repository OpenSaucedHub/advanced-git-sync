import { SyncConfig } from '../types';
export declare class GitSync {
    private git;
    private config;
    constructor(config: SyncConfig);
    setupRemote(): Promise<void>;
    syncBranch(branchName: string): Promise<void>;
}
