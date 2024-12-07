import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
import { Release } from '../types';
export declare function syncReleases(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<Release[]>;
