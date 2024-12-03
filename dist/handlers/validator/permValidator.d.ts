import { PermissionCheck, Config } from '@/src/types';
export declare class PermissionValidator {
    /**
     * Validates permissions for a specific platform
     */
    static validatePlatformPermissions(platform: 'github' | 'gitlab', checks: PermissionCheck[], sync: any, repoInfo: string): Promise<void>;
    /**
     * Validates permissions for both GitHub and GitLab
     */
    static validatePermissions(config: Config): Promise<void>;
}
