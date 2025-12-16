/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceDetailUserResponse } from './WorkspaceDetailUserResponse';
import type { WorkspaceMode } from './WorkspaceMode';
import type { WorkspaceRole } from './WorkspaceRole';
import type { WorkspaceSkillResponse } from './WorkspaceSkillResponse';
/**
 * ワークスペース詳細情報（一般ユーザー用）
 */
export type WorkspaceFullDetailResponse = {
    /**
     * ワークスペースID
     */
    id: number | string;
    /**
     * ワークスペース名
     */
    name: string;
    /**
     * ワークスペースコード
     */
    code?: string | null;
    /**
     * ワークスペースの説明
     */
    description?: string | null;
    /**
     * ジャンルID
     */
    genreId?: number | string | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    /**
     * メンバー一覧
     */
    members?: Array<WorkspaceDetailUserResponse>;
    owner?: (null | WorkspaceDetailUserResponse);
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成ユーザー（無効なユーザーでも含む）
     */
    createdBy?: WorkspaceDetailUserResponse;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * 更新ユーザー（無効なユーザーでも含む）
     */
    updatedBy?: WorkspaceDetailUserResponse;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    mode?: (null | WorkspaceMode);
    currentUserRole?: (null | WorkspaceRole);
    /**
     * ワークスペースに設定されているスキル一覧
     */
    skills?: Array<WorkspaceSkillResponse>;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number | string;
};

