import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
import { Release } from '../types';
interface ReleaseAnalysis {
    release: Release;
    action: 'create' | 'update' | 'skip';
    reason: string;
    commitExists: boolean;
    isLatest: boolean;
    strategy: 'normal' | 'point-to-latest' | 'skip-diverged';
}
export declare function syncReleases(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<ReleaseAnalysis[]>;
export {};
