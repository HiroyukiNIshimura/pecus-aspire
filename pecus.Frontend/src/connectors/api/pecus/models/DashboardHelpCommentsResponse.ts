/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HelpCommentItem } from './HelpCommentItem';
/**
 * ダッシュボード ヘルプコメント一覧レスポンス
 */
export type DashboardHelpCommentsResponse = {
    /**
     * ヘルプコメント一覧
     */
    comments: Array<HelpCommentItem>;
    /**
     * 総件数
     */
    totalCount: number | string;
};

