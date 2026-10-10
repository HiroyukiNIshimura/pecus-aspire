/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテムステータス更新リクエスト
 */
export type UpdateWorkspaceItemStatusRequest = {
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean | null;
    /**
     * アーカイブフラグ
     */
    isArchived?: boolean | null;
    /**
     * アーカイブ時に子アイテムとの親子関係を維持するかどうか（ドキュメントモード用）
     * true: 親子関係を維持する（子はツリーから除外されるが、親のアーカイブ解除で復活）
     * false: 子アイテムはルートに移動（親子関係を解除）
     * null: 子アイテムはそのまま（従来の動作）
     */
    keepChildrenRelation?: boolean | null;
    /**
     * アイテムの楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

