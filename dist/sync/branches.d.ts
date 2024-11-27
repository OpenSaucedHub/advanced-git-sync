import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
export declare function syncBranches(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").Branch[]>;
