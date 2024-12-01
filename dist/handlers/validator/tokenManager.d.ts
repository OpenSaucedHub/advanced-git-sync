interface TokenResult {
    token: string | undefined;
    warnings: string[];
}
/**
 * Manages token retrieval and basic validation
 */
export declare class TokenManager {
    private static setTokenEnvironment;
    static getGitHubToken(): TokenResult;
    static getGitLabToken(): TokenResult;
}
export {};
