import { Repository } from '@/src/types';
export declare class githubRepoHelper {
    private octokit;
    private repo;
    constructor(octokit: any, repo: Repository);
    /**
     * Attempts to create a GitHub repository if it doesn't exist
     * @returns Promise<boolean> - true if repository was created, false if it already existed
     */
    createIfNotExists(): Promise<boolean>;
    /**
     * Creates a new GitHub repository
     * @returns Promise<boolean> - true if successfully created
     */
    private createRepository;
    /**
     * Determines if the target repository should be created in an organization
     * @returns Promise<boolean> - true if organization, false if personal
     */
    private isOrganizationRepo;
}
