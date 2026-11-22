interface Env {
    CORS_ORIGIN?: string;
    NODE_ENV?: string;
}
export declare function corsHeaders(origin: string | null, env: Env): Record<string, string>;
export declare function json(data: unknown, status: number, origin: string | null, env: Env): Response;
export declare function error(message: string, code: string, status: number, origin: string | null, env: Env): Response;
export declare function success(data: unknown, origin: string | null, env: Env, status?: number): Response;
export declare function parseBody(request: Request): Promise<any>;
export {};
//# sourceMappingURL=responses.d.ts.map