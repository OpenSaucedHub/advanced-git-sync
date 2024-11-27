import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
export declare function syncIssues(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").Issue[]>;
