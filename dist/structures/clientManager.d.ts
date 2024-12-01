import { Config } from '../types';
import { GitHubClient } from './github/GitHub';
import { GitLabClient } from './gitlab/GitLab';
export declare class ClientManager {
    private static githubClient;
    private static gitlabClient;
    static getGitHubClient(config: Config): GitHubClient;
    static getGitLabClient(config: Config): GitLabClient;
}
