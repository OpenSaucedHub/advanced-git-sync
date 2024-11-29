import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
import { PullRequest } from '../types';
export declare function syncPullRequests(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<PullRequest[]>;
