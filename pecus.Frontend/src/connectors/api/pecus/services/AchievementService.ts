/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AchievementCollectionResponse } from '../models/AchievementCollectionResponse';
import type { AchievementRankingResponse } from '../models/AchievementRankingResponse';
import type { NewAchievementResponse } from '../models/NewAchievementResponse';
import type { UserAchievementResponse } from '../models/UserAchievementResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AchievementService {
    /**
     * 全実績マスタをユーザーの取得状況付きで取得（コレクションページ用）
     * 未取得の実績は名前・説明・アイコンが隠蔽されます（シークレットバッジ対応）。
     * @returns AchievementCollectionResponse OK
     * @throws ApiError
     */
    public static getApiAchievements(): CancelablePromise<Array<AchievementCollectionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/achievements',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 自分の取得済み実績を取得
     * @returns UserAchievementResponse OK
     * @throws ApiError
     */
    public static getApiAchievementsMe(): CancelablePromise<Array<UserAchievementResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/achievements/me',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 未通知の実績を取得
     * まだユーザーに通知していない新規取得実績を取得します。
     * バッジ取得演出の表示判定に使用します。
     * @returns NewAchievementResponse OK
     * @throws ApiError
     */
    public static getApiAchievementsMeUnnotified(): CancelablePromise<Array<NewAchievementResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/achievements/me/unnotified',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 実績を通知済みにマーク
     * バッジ取得演出を表示した後に呼び出し、重複表示を防ぎます。
     * @param achievementId 実績マスタID
     * @returns void
     * @throws ApiError
     */
    public static postApiAchievementsMeNotify(
        achievementId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/achievements/me/{achievementId}/notify',
            path: {
                'achievementId': achievementId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 全ての未通知実績を通知済みにマーク
     * 一括で全ての未通知実績を通知済みにします。
     * コレクションページを開いた際などに使用します。
     * @returns void
     * @throws ApiError
     */
    public static postApiAchievementsMeNotifyAll(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/achievements/me/notify-all',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * バッジ獲得ランキングを取得
     * 組織全体またはワークスペース内のバッジ獲得ランキングを取得します。
     * 3種類のランキングを返します:
     * - 難易度ランカー: 難しいバッジを多く取得している人
     * - 取得数ランカー: バッジ総数が多い人
     * - 成長速度ランカー: 期間あたりの取得効率が高い人
     *
     * BadgeVisibility が Private のユーザーはランキングから除外されます。
     * @param workspaceId ワークスペースID（指定しない場合は組織全体）
     * @returns AchievementRankingResponse OK
     * @throws ApiError
     */
    public static getApiAchievementsRanking(
        workspaceId?: number,
    ): CancelablePromise<AchievementRankingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/achievements/ranking',
            query: {
                'workspaceId': workspaceId,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
