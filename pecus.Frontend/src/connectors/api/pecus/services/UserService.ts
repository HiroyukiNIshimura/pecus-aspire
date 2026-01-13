/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserAchievementResponse } from '../models/UserAchievementResponse';
import type { UserSearchResultResponse } from '../models/UserSearchResultResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * ユーザーをあいまい検索
     * ユーザー名またはメールアドレスであいまい検索を行います。
     * pgroonga を使用しているため、日本語の漢字のゆらぎやタイポにも対応します。
     * ワークスペースへのメンバー追加時などに使用します。
     * @param q 検索クエリ（2文字以上100文字以内）
     * @param limit 取得件数上限（1〜50、デフォルト20）
     * @returns UserSearchResultResponse 検索結果を返します
     * @throws ApiError
     */
    public static getApiUsersSearch(
        q?: string,
        limit?: number,
    ): CancelablePromise<Array<UserSearchResultResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/search',
            query: {
                'Q': q,
                'Limit': limit,
            },
            errors: {
                400: `検索クエリが短すぎます`,
            },
        });
    }
    /**
     * 指定ユーザーの取得済み実績を取得
     * 対象ユーザーの公開範囲設定に基づきフィルタリングされます。
     * 公開範囲外の場合は空のリストが返却されます。
     * @param userId 対象ユーザーID
     * @returns UserAchievementResponse OK
     * @throws ApiError
     */
    public static getApiUsersAchievements(
        userId: number,
    ): CancelablePromise<Array<UserAchievementResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}/achievements',
            path: {
                'userId': userId,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
