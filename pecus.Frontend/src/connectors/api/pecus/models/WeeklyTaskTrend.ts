/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 週ごとのタスクトレンドデータ
 */
export type WeeklyTaskTrend = {
    /**
     * 週の開始日（月曜日）
     */
    weekStart: string;
    /**
     * 週番号（年間での週番号）
     */
    weekNumber: number;
    /**
     * 表示用ラベル（例: "12/2〜12/8"）
     */
    label: string;
    /**
     * その週に作成されたタスク数
     */
    createdCount: number;
    /**
     * その週に完了したタスク数
     */
    completedCount: number;
};

