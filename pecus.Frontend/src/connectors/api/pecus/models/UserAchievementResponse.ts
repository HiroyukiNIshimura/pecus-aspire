/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AchievementCategory } from './AchievementCategory';
import type { AchievementDifficulty } from './AchievementDifficulty';
/**
 * ユーザー実績レスポンス（取得済み実績用）
 */
export type UserAchievementResponse = {
    /**
     * 実績マスタID
     */
    id: number;
    /**
     * 実績コード
     */
    code: string;
    /**
     * 実績名
     */
    name: string;
    /**
     * 実績名（英語）
     */
    nameEn: string;
    /**
     * 説明文
     */
    description: string;
    /**
     * 説明文（英語）
     */
    descriptionEn: string;
    /**
     * アイコンパス
     */
    iconPath?: string | null;
    difficulty: AchievementDifficulty;
    category: AchievementCategory;
    /**
     * 取得日時
     */
    earnedAt: string;
};

