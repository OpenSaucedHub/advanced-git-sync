import { Config } from '../types';
export declare function correctTypos(config: Record<string, unknown>): Record<string, unknown>;
export declare function fixSyntaxErrors(yamlContent: string): string;
export declare function prepareConfig(parsedConfig: Record<string, unknown>): Config;
