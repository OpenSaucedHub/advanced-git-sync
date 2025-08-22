import { Repository } from '@/src/types';
export declare class gitlabProjectHelper {
    private gitlab;
    private repo;
    constructor(gitlab: any, repo: Repository);
    /**
     * Attempts to create a GitLab project if it doesn't exist
     * @returns Promise<number> - the project ID (existing or newly created)
     */
    createIfNotExists(): Promise<number>;
    /**
     * Creates a new GitLab project
     * @returns Promise<number> - the created project ID
     */
    private createProject;
    /**
     * Finds the correct namespace ID for the project
     * @returns Promise<number | undefined> - the namespace ID or undefined if not found
     */
    private findNamespace;
}
