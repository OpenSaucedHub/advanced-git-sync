import { PermissionCheck } from '@/src/types';
export declare class PermissionValidator {
    static validatePlatformPermissions(platform: 'github' | 'gitlab', checks: PermissionCheck[], sync: any, repoInfo: string): Promise<void>;
}
