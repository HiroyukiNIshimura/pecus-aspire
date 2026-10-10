/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RankingItemDto } from './RankingItemDto';
/**
 * バッジ獲得ランキングレスポンス
 */
export type AchievementRankingResponse = {
    /**
     * 難易度ランカー Top3（難しいバッジを多く取得している人）
     */
    difficultyRanking: Array<RankingItemDto>;
    /**
     * 取得数ランカー Top3（バッジ総数が多い人）
     */
    countRanking: Array<RankingItemDto>;
    /**
     * 成長速度ランカー Top3（期間あたりの取得効率が高い人）
     */
    growthRanking: Array<RankingItemDto>;
};

