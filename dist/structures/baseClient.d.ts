import { Config, Repository, IClient } from '../types';
export declare abstract class BaseClient implements IClient {
    config: Config;
    repo: Repository;
    constructor(config: Config, repo: Repository);
    abstract validateAccess(): Promise<void>;
}
