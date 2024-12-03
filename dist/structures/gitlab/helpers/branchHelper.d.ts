import { Branch, Config } from '@/src/types';
export declare class BranchHelper {
    private gitlab;
    private config;
    private getProjectId;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    sync(): Promise<Branch[]>;
    create(name: string, commitSha: string): Promise<void>;
    update(name: string, commitSha: string): Promise<void>;
}
