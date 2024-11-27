import { SyncConfig } from '../types';
export declare class ConfigLoader {
    private static readonly DEFAULT_CONFIG_PATH;
    loadConfig(customPath?: string): Promise<SyncConfig>;
}
