/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserWorkloadInfo } from './UserWorkloadInfo';
/**
 * 複数ユーザーの負荷情報レスポンス
 */
export type UsersWorkloadResponse = {
    /**
     * ユーザーID別の負荷情報
     */
    workloads?: Record<string, UserWorkloadInfo>;
};

