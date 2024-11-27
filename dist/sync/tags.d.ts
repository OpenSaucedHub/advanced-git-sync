import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
export declare function syncTags(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<string[]>;
