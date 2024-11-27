import { SyncConfig } from '../types';
export declare class GitLabService {
    private client;
    constructor(config: SyncConfig);
    syncPullRequest(prData: {
        title: string;
        description: string;
        sourceBranch: string;
        targetBranch: string;
        projectId: string | number;
    }): Promise<import("@gitbeaker/rest").ExpandedMergeRequestSchema | import("@gitbeaker/rest").Camelize<import("@gitbeaker/rest").ExpandedMergeRequestSchema>>;
    syncIssue(issueData: {
        title: string;
        description: string;
        projectId: string | number;
        labels: string[];
    }): Promise<import("@gitbeaker/rest").IssueSchema | import("@gitbeaker/rest").Camelize<import("@gitbeaker/rest").IssueSchema>>;
}
