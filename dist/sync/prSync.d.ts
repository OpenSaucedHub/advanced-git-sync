import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
import { PullRequest } from '../types';
export declare function syncPullRequests(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<PullRequest[]>;
