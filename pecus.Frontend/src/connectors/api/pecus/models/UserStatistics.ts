/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleUserCountResponse } from './RoleUserCountResponse';
import type { SkillUserCountResponse } from './SkillUserCountResponse';
/**
 * ユーザー統計情報レスポンス
 */
export type UserStatistics = {
    /**
     * スキルごとのユーザー数サマリ
     */
    skillCounts?: Array<SkillUserCountResponse> | null;
    /**
     * ロールごとのユーザー数サマリ
     */
    roleCounts?: Array<RoleUserCountResponse> | null;
    /**
     * アクティブなユーザー数
     */
    activeUserCount?: number;
    /**
     * 非アクティブなユーザー数
     */
    inactiveUserCount?: number;
    /**
     * ワークスペースに参加しているユーザー数
     */
    workspaceParticipationCount?: number;
    /**
     * ワークスペースに参加していないユーザー数
     */
    noWorkspaceParticipationCount?: number;
};

