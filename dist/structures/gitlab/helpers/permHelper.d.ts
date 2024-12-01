import { BaseClient } from '@/src/structures/baseClient';
import { Repository, Config } from '@/src/types';
export declare class PermissionHelper extends BaseClient {
    private gitlab;
    constructor(gitlab: any, repo: Repository, config: Config);
    private get projectPath();
    validateAccess(): Promise<void>;
}
