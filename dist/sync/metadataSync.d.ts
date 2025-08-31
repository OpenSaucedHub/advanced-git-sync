import { GitHubClient } from '@/src/structures/github/GitHub';
import { GitLabClient } from '@/src/structures/gitlab/GitLab';
export declare class MetadataSync {
    private githubClient;
    private gitlabClient;
    constructor(githubClient: GitHubClient, gitlabClient: GitLabClient);
    /**
     * Synchronize repository descriptions bidirectionally
     * Silently fails if descriptions cannot be synced
     */
    syncDescription(): Promise<void>;
}
