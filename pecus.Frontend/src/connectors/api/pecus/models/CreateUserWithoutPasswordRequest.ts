/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * パスワードなしユーザー登録リクエスト（管理者用）
 */
export type CreateUserWithoutPasswordRequest = {
    /**
     * ユーザー名
     */
    username: string;
    /**
     * メールアドレス
     */
    email: string;
    /**
     * ロールIDのリスト。既存のすべてのロールを置き換えます。
     * 空のリストまたはnullの場合はすべてのロールを削除します。
     */
    roles: Array<number>;
};

