/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvatarType } from './AvatarType';
/**
 * プロフィール更新リクエスト
 */
export type UpdateProfileRequest = {
    /**
     * ユーザー名
     */
    username?: string | null;
    avatarType?: AvatarType;
    /**
     * アバターURL（相対パスまたは絶対URLを許可）
     */
    avatarUrl?: string | null;
    /**
     * スキルIDリスト
     */
    skillIds?: Array<number> | null;
    /**
     * ユーザーの楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

