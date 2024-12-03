import { Repository, Config, IClient } from '../../types';
import { BranchHelper, IssueHelper, PullRequestHelper, ReleaseHelper, TagHelper } from './helpers';
export declare class GitLabClient implements IClient {
    config: Config;
    repo: Repository;
    private gitlab;
    branches: BranchHelper;
    issues: IssueHelper;
    pullRequest: PullRequestHelper;
    release: ReleaseHelper;
    tags: TagHelper;
    private projectId;
    constructor(config: Config, repo: Repository);
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
    syncBranches(): Promise<import("../../types").Branch[]>;
    createBranch(name: string, commitSha: string): Promise<void>;
    updateBranch(name: string, commitSha: string): Promise<void>;
    syncPullRequests(): Promise<import("../../types").PullRequest[]>;
    createPullRequest(pr: any): Promise<void>;
    updatePullRequest(number: number, pr: any): Promise<void>;
    closePullRequest(number: number): Promise<void>;
    syncIssues(): Promise<import("../../types").Issue[]>;
    getIssueComments(issueNumber: number): Promise<import("../../types").Comment[]>;
    createIssue(issue: any): Promise<void>;
    updateIssue(issueNumber: number, issue: any): Promise<void>;
    createIssueComment(issueNumber: number, comment: any): Promise<void>;
    syncReleases(): Promise<import("../../types").Release[]>;
    createRelease(release: any): Promise<void>;
    updateRelease(release: any): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: any): Promise<Buffer<ArrayBufferLike>>;
    uploadReleaseAsset(releaseId: string, asset: any): Promise<void>;
    syncTags(): Promise<import("../../types").Tag[]>;
    createTag(tag: any): Promise<void>;
    updateTag(tag: any): Promise<void>;
}
