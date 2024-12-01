import { Repository, Config } from '@/src/types';
import { BaseClient } from '../../baseClient';
export declare class permHelper extends BaseClient {
    private octokit;
    constructor(octokit: any, repo: Repository, config: Config);
    validateAccess(): Promise<void>;
}
