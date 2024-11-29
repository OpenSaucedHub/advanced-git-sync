import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
import { Release } from '../types';
export declare function syncReleases(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<Release[]>;
export declare function syncTags(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").Tag[]>;
