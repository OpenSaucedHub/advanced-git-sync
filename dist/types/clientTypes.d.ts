import { Config, Repository } from '.';
export interface PermissionCheck {
    feature: string;
    check: () => Promise<unknown>;
    warningMessage: string;
}
export interface IClient {
    config: Config;
    repo: Repository;
    validateAccess(): Promise<void>;
}
