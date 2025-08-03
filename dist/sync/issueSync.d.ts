import { GitHubClient } from '../structures/github/GitHub';
import { IssueComparison, Issue } from '../types';
import { GitLabClient } from '../structures/gitlab/GitLab';
export declare function compareIssues(sourceIssues: Issue[], targetIssues: Issue[]): IssueComparison[];
export declare function prepareSourceLink(sourceClient: GitHubClient | GitLabClient, sourceIssue: Issue): string;
export declare function syncIssues(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<void>;
