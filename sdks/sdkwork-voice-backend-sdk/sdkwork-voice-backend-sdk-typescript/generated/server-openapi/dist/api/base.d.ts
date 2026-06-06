import type { QueryParams } from '../types/common';
import type { HttpClient } from '../http/client';
export declare abstract class BaseApi {
    protected http: HttpClient;
    protected basePath: string;
    constructor(http: HttpClient, basePath: string);
    protected get<T>(path: string, params?: QueryParams, headers?: Record<string, string>): Promise<T>;
    protected post<T>(path: string, body?: unknown, params?: QueryParams, headers?: Record<string, string>, contentType?: string): Promise<T>;
    protected put<T>(path: string, body?: unknown, params?: QueryParams, headers?: Record<string, string>, contentType?: string): Promise<T>;
    protected delete<T>(path: string, params?: QueryParams, headers?: Record<string, string>): Promise<T>;
    protected patch<T>(path: string, body?: unknown, params?: QueryParams, headers?: Record<string, string>, contentType?: string): Promise<T>;
    protected request<T>(method: string, path: string, body?: unknown, params?: QueryParams, headers?: Record<string, string>, contentType?: string): Promise<T>;
}
//# sourceMappingURL=base.d.ts.map