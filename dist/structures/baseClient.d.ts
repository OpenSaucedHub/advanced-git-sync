import { Config, PermissionCheck, Repository } from '@/src/types';
import { GitHubClient } from '@/src/structures/github/GitHub';
import { GitLabClient } from '@/src/structures/gitlab/GitLab';
export declare abstract class BaseClient {
    protected config: Config;
    protected repo: Repository;
    constructor(config: Config, repo: Repository);
    protected validatePermissions(platform: 'github' | 'gitlab', sync: any, checks: PermissionCheck[]): Promise<void>;
    abstract validateAccess(): Promise<void>;
}
export declare class ClientManager {
    private static githubClient;
    private static gitlabClient;
    static getGitHubClient(config: Config): GitHubClient;
    static getGitLabClient(config: Config): GitLabClient;
}
