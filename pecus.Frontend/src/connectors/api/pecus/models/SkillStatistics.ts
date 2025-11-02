/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SkillUsageItem } from "./SkillUsageItem";
/**
 * スキル利用統計のレスポンス
 */
export type SkillStatistics = {
  /**
   * スキルのトータル件数
   */
  totalSkills?: number;
  /**
   * アクティブなスキルの件数
   */
  activeSkills?: number;
  /**
   * 非アクティブなスキルの件数
   */
  inactiveSkills?: number;
  /**
   * 利用されているスキルのトップ５
   */
  topUsedSkills?: Array<SkillUsageItem> | null;
  /**
   * 利用されていないスキルのリスト
   */
  unusedSkills?: Array<SkillUsageItem> | null;
};
