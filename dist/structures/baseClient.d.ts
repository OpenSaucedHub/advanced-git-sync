import { Config, PermissionCheck, Repository, IClient } from '../types';
export declare abstract class BaseClient implements IClient {
    config: Config;
    repo: Repository;
    constructor(config: Config, repo: Repository);
    protected validatePermissions(platform: 'github' | 'gitlab', sync: any, checks: PermissionCheck[]): Promise<void>;
    abstract validateAccess(): Promise<void>;
}
