import { Branch, Config, Repository } from '@/src/types';
export declare class BranchHelper {
    private gitlab;
    private repo;
    private config;
    constructor(gitlab: any, repo: Repository, config: Config);
    private get projectPath();
    sync(): Promise<Branch[]>;
    create(name: string, commitSha: string): Promise<void>;
    update(name: string, commitSha: string): Promise<void>;
}
