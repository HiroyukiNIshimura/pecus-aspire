/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvatarType } from './AvatarType';
/**
 * プロフィール更新リクエスト
 */
export type UpdateProfileRequest = {
    username?: string | null;
    avatarType?: (null | AvatarType);
    userAvatarPath?: string | null;
    skillIds?: any[] | null;
    rowVersion: number | string;
};

