import { z } from 'zod';
export declare const SyncConfigSchema: z.ZodObject<{
    gitlab: z.ZodObject<{
        url: z.ZodString;
        token: z.ZodString;
        username: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        token: string;
        username: string;
    }, {
        url: string;
        token: string;
        username: string;
    }>;
    sync: z.ZodDefault<z.ZodObject<{
        branches: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            protected: z.ZodDefault<z.ZodBoolean>;
            pattern: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            protected: boolean;
            pattern?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            protected?: boolean | undefined;
            pattern?: string | undefined;
        }>>;
        pullRequests: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            autoMerge: z.ZodDefault<z.ZodBoolean>;
            labels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            autoMerge: boolean;
            labels: string[];
        }, {
            enabled?: boolean | undefined;
            autoMerge?: boolean | undefined;
            labels?: string[] | undefined;
        }>>;
        issues: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            labels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            syncComments: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            labels: string[];
            syncComments: boolean;
        }, {
            enabled?: boolean | undefined;
            labels?: string[] | undefined;
            syncComments?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern?: string | undefined;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string[];
        };
        issues: {
            enabled: boolean;
            labels: string[];
            syncComments: boolean;
        };
    }, {
        branches?: {
            enabled?: boolean | undefined;
            protected?: boolean | undefined;
            pattern?: string | undefined;
        } | undefined;
        pullRequests?: {
            enabled?: boolean | undefined;
            autoMerge?: boolean | undefined;
            labels?: string[] | undefined;
        } | undefined;
        issues?: {
            enabled?: boolean | undefined;
            labels?: string[] | undefined;
            syncComments?: boolean | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    gitlab: {
        url: string;
        token: string;
        username: string;
    };
    sync: {
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern?: string | undefined;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string[];
        };
        issues: {
            enabled: boolean;
            labels: string[];
            syncComments: boolean;
        };
    };
}, {
    gitlab: {
        url: string;
        token: string;
        username: string;
    };
    sync?: {
        branches?: {
            enabled?: boolean | undefined;
            protected?: boolean | undefined;
            pattern?: string | undefined;
        } | undefined;
        pullRequests?: {
            enabled?: boolean | undefined;
            autoMerge?: boolean | undefined;
            labels?: string[] | undefined;
        } | undefined;
        issues?: {
            enabled?: boolean | undefined;
            labels?: string[] | undefined;
            syncComments?: boolean | undefined;
        } | undefined;
    } | undefined;
}>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
