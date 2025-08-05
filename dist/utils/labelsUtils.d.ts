export declare class LabelHelper {
    /**
     * Normalizes label configuration from config
     */
    static normalizeConfigLabels(labels: string | string[] | undefined): string[];
    /**
     * Normalizes GitHub labels to a standard format
     * GitHub labels come as an array of objects: { name: string, ... }
     */
    static normalizeGitHubLabels(labels: Array<{
        name: string;
    }>): string[];
    /**
     * Normalizes GitLab labels to a standard format
     * GitLab labels come as either string[] or comma-separated string
     */
    static normalizeGitLabLabels(labels: string[] | string | undefined): string[];
    /**
     * Combines source labels with the 'synced' label and normalizes them
     * Always includes the 'synced' label for synced content
     */
    static combineLabels(sourceLabels: string[] | Array<{
        name: string;
    }> | string | undefined, platform: 'github' | 'gitlab'): string[];
    /**
     * Formats labels for GitLab API (comma-separated string)
     */
    static formatForGitLab(labels: string[]): string;
    /**
     * Checks if two label sets are equivalent
     */
    static areLabelsEqual(labels1: string[], labels2: string[]): boolean;
}
