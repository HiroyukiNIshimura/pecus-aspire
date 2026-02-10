/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskCommentType } from './TaskCommentType';
import type { UserIdentityResponse } from './UserIdentityResponse';
/**
 * タスクコメント詳細レスポンス
 */
export type TaskCommentDetailResponse = {
    /**
     * コメントID
     */
    id: number;
    /**
     * タスクID
     */
    workspaceTaskId?: number;
    user?: UserIdentityResponse;
    /**
     * コメント内容
     */
    content?: string;
    commentType?: TaskCommentType | null;
    /**
     * 削除済みフラグ
     */
    isDeleted?: boolean;
    /**
     * 削除日時
     */
    deletedAt?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

