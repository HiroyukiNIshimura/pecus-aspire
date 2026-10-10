/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 子アイテム数レスポンス
 */
export type ChildrenCountResponse = {
    /**
     * 対象アイテムID
     */
    itemId?: number;
    /**
     * 直接の子アイテム数
     */
    childrenCount?: number;
    /**
     * 全子孫アイテム数（孫、ひ孫...を含む）
     */
    totalDescendantsCount?: number;
};

