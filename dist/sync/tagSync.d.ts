import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
export declare function syncTags(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").Tag[]>;
