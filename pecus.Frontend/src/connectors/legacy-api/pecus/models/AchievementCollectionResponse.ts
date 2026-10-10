/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AchievementCategory } from './AchievementCategory';
import type { AchievementDifficulty } from './AchievementDifficulty';
/**
 * 実績コレクションレスポンス（バッジコレクションページ用）
 */
export type AchievementCollectionResponse = {
    /**
     * 実績マスタID
     */
    id: number;
    /**
     * 実績コード（例: EARLY_BIRD）
     */
    code: string;
    /**
     * 実績名（未取得の場合は "???"）
     */
    name: string;
    /**
     * 実績名（英語、未取得の場合は "???"）
     */
    nameEn: string;
    /**
     * 説明文（未取得の場合は "???"）
     */
    description: string;
    /**
     * 説明文（英語、未取得の場合は "???"）
     */
    descriptionEn: string;
    /**
     * アイコンパス（未取得の場合は null）
     */
    iconPath?: string | null;
    difficulty: AchievementDifficulty;
    category: AchievementCategory;
    /**
     * 取得済みかどうか
     */
    isEarned: boolean;
    /**
     * 取得日時（未取得の場合は null）
     */
    earnedAt?: string | null;
};

