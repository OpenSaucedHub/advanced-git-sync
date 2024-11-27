import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
export declare function syncReleases(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").Release[]>;
