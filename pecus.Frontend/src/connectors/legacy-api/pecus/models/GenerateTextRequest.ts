/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * AIアシスタントによるテキスト生成リクエスト
 */
export type GenerateTextRequest = {
    /**
     * エディタ全体のMarkdownコンテンツ（カーソル位置マーカー含む）
     */
    markdown: string;
    /**
     * カーソル位置を示すマーカー文字列
     */
    cursorMarker: string;
    /**
     * ユーザーからの指示（何を生成してほしいか）
     */
    userPrompt: string;
};

