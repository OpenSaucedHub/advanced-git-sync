import { Repository, Config } from '@/src/types';
import { BranchHelper, IssueHelper, PullRequestHelper, ReleaseHelper, TagHelper } from './helpers';
import { BaseClient } from '../baseClient';
export declare class GitLabClient extends BaseClient {
    private gitlab;
    branches: BranchHelper;
    issues: IssueHelper;
    pullRequest: PullRequestHelper;
    release: ReleaseHelper;
    tags: TagHelper;
    private projectId;
    constructor(config: Config, repo?: Repository);
    private formatHostUrl;
    private getProjectId;
    validateAccess(): Promise<void>;
    /**
     * Get repository information
     * @returns Repository details including URL
     */
    getRepoInfo(): {
        url: string;
        owner: string;
        repo: string;
    };
    syncBranches(): Promise<import("@/src/types").Branch[]>;
    createBranch(name: string, commitSha: string): Promise<void>;
    updateBranch(name: string, commitSha: string): Promise<void>;
    syncPullRequests(): Promise<import("@/src/types").PullRequest[]>;
    createPullRequest(pr: any): Promise<void>;
    updatePullRequest(number: number, pr: any): Promise<void>;
    closePullRequest(number: number): Promise<void>;
    syncIssues(): Promise<import("@/src/types").Issue[]>;
    getIssueComments(issueNumber: number): Promise<import("@/src/types").Comment[]>;
    createIssue(issue: any): Promise<void>;
    updateIssue(issueNumber: number, issue: any): Promise<void>;
    createIssueComment(issueNumber: number, comment: any): Promise<void>;
    syncReleases(): Promise<import("@/src/types").Release[]>;
    createRelease(release: any): Promise<void>;
    updateRelease(release: any): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: any): Promise<Buffer<ArrayBufferLike>>;
    uploadReleaseAsset(releaseId: string, asset: any): Promise<void>;
    syncTags(): Promise<import("@/src/types").Tag[]>;
    createTag(tag: any): Promise<void>;
    updateTag(tag: any): Promise<void>;
}
