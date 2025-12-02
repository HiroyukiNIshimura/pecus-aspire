/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MyItemRelationType } from '../models/MyItemRelationType';
import type { WorkspaceItemDetailResponsePagedResponse } from '../models/WorkspaceItemDetailResponsePagedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MyWorkspaceItemService {
    /**
     * マイアイテム一覧を取得
     * ログインユーザーがオーナー、担当者、コミッター、またはPIN済みのアイテムを取得
     * @param page ページ番号（1から開始）
     * @param relation 関連タイプ（All, Owner, Assignee, Committer, Pinned）
     * @returns WorkspaceItemDetailResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiMyWorkspaceItems(
        page?: number,
        relation?: MyItemRelationType,
    ): CancelablePromise<WorkspaceItemDetailResponsePagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/workspace-items',
            query: {
                'Page': page,
                'Relation': relation,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
