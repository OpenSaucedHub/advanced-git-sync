import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
export declare function syncPullRequests(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").PullRequest[]>;
