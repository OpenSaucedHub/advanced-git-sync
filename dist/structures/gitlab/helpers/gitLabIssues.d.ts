import { Issue, Comment, Config } from '@/src/types';
export declare class gitlabIssueHelper {
    private gitlab;
    private config;
    private getProjectId;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    syncIssues(): Promise<Issue[]>;
    private processLabels;
    getIssueComments(issueNumber: number): Promise<Comment[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
    createIssueComment(issueNumber: number, comment: Comment): Promise<void>;
}
