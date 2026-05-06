import { z } from 'zod';

export const analyzeHealthInputSchema = z
  .object({
    scope: z.enum(['Organization', 'Workspace'], { error: '分析スコープが不正です。' }),
    workspaceId: z
      .number({ error: 'ワークスペースIDが不正です。' })
      .int('ワークスペースIDが不正です。')
      .positive('ワークスペースIDが不正です。')
      .nullable()
      .optional(),
    analysisType: z.enum(
      ['CurrentHealth', 'ProblemPickup', 'FuturePrediction', 'Recommendation', 'Comparison', 'Summary'],
      { error: '分析タイプが不正です。' },
    ),
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'Workspace' && (data.workspaceId === null || data.workspaceId === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['workspaceId'],
        message: 'ワークスペースを選択してください',
      });
    }
  });

export type AnalyzeHealthInput = z.infer<typeof analyzeHealthInputSchema>;
