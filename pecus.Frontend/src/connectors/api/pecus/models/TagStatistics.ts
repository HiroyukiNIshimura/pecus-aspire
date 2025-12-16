/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TagUsageItem } from './TagUsageItem';
/**
 * タグ利用統計のレスポンス
 */
export type TagStatistics = {
    /**
     * タグのトータル件数
     */
    totalTags: number;
    /**
     * アクティブなタグの件数
     */
    activeTags: number;
    /**
     * 非アクティブなタグの件数
     */
    inactiveTags: number;
    /**
     * 利用されているタグのトップ５
     */
    topUsedTags: Array<TagUsageItem>;
    /**
     * 利用されていないタグのリスト
     */
    unusedTags: Array<TagUsageItem>;
};

