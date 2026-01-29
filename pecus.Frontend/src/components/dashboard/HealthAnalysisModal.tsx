'use client';

import { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { analyzeHealth } from '@/actions/dashboard';
import { getMyWorkspaces } from '@/actions/workspace';
import AiProgressOverlay from '@/components/common/overlays/AiProgressOverlay';
import type {
  HealthAnalysisResponse,
  HealthAnalysisScope,
  HealthAnalysisType,
  WorkspaceListItemResponse,
} from '@/connectors/api/pecus';
import { useAiSuggestion } from '@/hooks/useAiSuggestion';

interface HealthAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 分析タイプの定義 */
const analysisTypes: { type: HealthAnalysisType; label: string; icon: string; description: string }[] = [
  {
    type: 'CurrentHealth',
    label: '現在の健康状態',
    icon: 'icon-[mdi--heart-pulse]',
    description: '現在の状況を総合的に診断します',
  },
  {
    type: 'ProblemPickup',
    label: '問題点の抽出',
    icon: 'icon-[mdi--alert-circle-outline]',
    description: '潜在的な問題や懸念事項を特定します',
  },
  {
    type: 'FuturePrediction',
    label: '将来予測',
    icon: 'icon-[mdi--crystal-ball]',
    description: 'トレンドから今後の見通しを予測します',
  },
  {
    type: 'Recommendation',
    label: '改善提案',
    icon: 'icon-[mdi--lightbulb-on-outline]',
    description: '具体的な改善アクションを提案します',
  },
  {
    type: 'Comparison',
    label: '比較分析',
    icon: 'icon-[mdi--compare-horizontal]',
    description: '過去との比較や他との相対評価を行います',
  },
  {
    type: 'Summary',
    label: 'サマリー',
    icon: 'icon-[mdi--text-box-check-outline]',
    description: '全体像を簡潔にまとめます',
  },
];

/**
 * 健康状態分析モーダル
 * AIを使って組織/ワークスペースの健康状態を分析する
 */
export default function HealthAnalysisModal({ isOpen, onClose }: HealthAnalysisModalProps) {
  // スコープ関連
  const [scope, setScope] = useState<HealthAnalysisScope>('Organization');
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [hasFetchedWorkspaces, setHasFetchedWorkspaces] = useState(false);

  // 分析関連
  const [selectedType, setSelectedType] = useState<HealthAnalysisType>('CurrentHealth');
  const { isLoading, startLoading, finishLoading, cancel: cancelAnalysis, checkCancelled } = useAiSuggestion();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HealthAnalysisResponse | null>(null);

  // モーダルを開いたときにボディスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // モーダルが開いた時にワークスペースリストを取得
  useEffect(() => {
    if (isOpen && !hasFetchedWorkspaces && !isLoadingWorkspaces) {
      const fetchWorkspaces = async () => {
        setIsLoadingWorkspaces(true);
        try {
          const response = await getMyWorkspaces();
          if (response.success) {
            setWorkspaces(response.data);
          }
        } catch (err) {
          console.error('Failed to fetch workspaces:', err);
        } finally {
          setIsLoadingWorkspaces(false);
          setHasFetchedWorkspaces(true);
        }
      };
      fetchWorkspaces();
    }
  }, [isOpen, hasFetchedWorkspaces, isLoadingWorkspaces]);

  // ワークスペーススコープ選択時に最初のワークスペースを自動選択
  useEffect(() => {
    if (scope === 'Workspace' && workspaces.length > 0 && selectedWorkspaceId === null) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [scope, workspaces, selectedWorkspaceId]);

  // モーダルを閉じるときに状態をリセット
  const handleClose = useCallback(() => {
    setResult(null);
    setError(null);
    setScope('Organization');
    setSelectedWorkspaceId(null);
    setWorkspaces([]);
    setHasFetchedWorkspaces(false);
    onClose();
  }, [onClose]);

  // 分析を実行
  const handleAnalyze = async () => {
    // ワークスペーススコープでワークスペースが選択されていない場合はエラー
    if (scope === 'Workspace' && !selectedWorkspaceId) {
      setError('ワークスペースを選択してください');
      return;
    }

    startLoading();
    setError(null);
    setResult(null);

    try {
      const response = await analyzeHealth({
        scope,
        workspaceId: scope === 'Workspace' ? (selectedWorkspaceId ?? undefined) : undefined,
        analysisType: selectedType,
      });

      // キャンセルされていた場合は結果を無視
      if (checkCancelled()) return;

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || '分析に失敗しました');
      }
    } catch (err) {
      // キャンセルされていた場合はエラーも無視
      if (checkCancelled()) return;
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      if (!checkCancelled()) finishLoading();
    }
  };

  // 結果をクリアして別の分析を実行
  const handleBack = () => {
    setResult(null);
    setError(null);
  };

  // 選択中のワークスペース名を取得
  const selectedWorkspaceName = workspaces.find((w) => w.id === selectedWorkspaceId)?.name;

  // 分析可能かどうか
  const canAnalyze = scope === 'Organization' || (scope === 'Workspace' && selectedWorkspaceId !== null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="icon-[mdi--stethoscope] size-6 text-primary" aria-hidden="true" />
            健康診断
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {/* 分析中オーバーレイ */}
          <AiProgressOverlay isVisible={isLoading} message="AIが分析中..." onCancel={cancelAnalysis} />
          {/* 結果表示 */}
          {result ? (
            <div className="space-y-4">
              {/* 結果ヘッダー */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span
                    className={`${analysisTypes.find((t) => t.type === result.analysisType)?.icon} size-5 text-primary`}
                    aria-hidden="true"
                  />
                  {analysisTypes.find((t) => t.type === result.analysisType)?.label}
                </div>
                <div className="badge badge-outline">
                  {result.scope === 'Organization' ? '組織全体' : (result.workspaceName ?? 'ワークスペース')}
                </div>
              </div>

              {/* 分析結果 */}
              <div className="bg-base-200 rounded-lg p-4 text-sm leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                <Markdown>{result.analysis}</Markdown>
              </div>

              {/* 生成日時 */}
              <div className="text-xs text-base-content/60 text-right">
                生成日時: {new Date(result.generatedAt).toLocaleString('ja-JP')}
              </div>

              {/* 戻るボタン */}
              <div className="flex justify-center pt-2">
                <button type="button" className="btn btn-outline" onClick={handleBack}>
                  <span className="icon-[mdi--arrow-left] size-5" aria-hidden="true" />
                  別の分析を実行
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* スコープ選択 */}
              <fieldset className="form-control">
                <legend className="label">
                  <span className="label-text font-semibold">診断対象</span>
                </legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn flex-1 ${scope === 'Organization' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setScope('Organization')}
                    disabled={isLoading}
                  >
                    <span className="icon-[mdi--domain] size-5" aria-hidden="true" />
                    組織全体
                  </button>
                  <button
                    type="button"
                    className={`btn flex-1 ${scope === 'Workspace' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setScope('Workspace')}
                    disabled={isLoading || (hasFetchedWorkspaces && workspaces.length === 0)}
                  >
                    <span className="icon-[mdi--folder-outline] size-5" aria-hidden="true" />
                    ワークスペース
                  </button>
                </div>
              </fieldset>

              {/* ワークスペース選択（ワークスペーススコープの場合） */}
              {scope === 'Workspace' && (
                <div className="form-control">
                  <label htmlFor="workspace-select" className="label">
                    <span className="label-text font-semibold">ワークスペース</span>
                  </label>
                  {isLoadingWorkspaces ? (
                    <div className="flex items-center gap-2 text-base-content/60">
                      <span className="loading loading-spinner loading-sm" />
                      読み込み中...
                    </div>
                  ) : workspaces.length === 0 ? (
                    <div className="text-base-content/60 text-sm">ワークスペースがありません</div>
                  ) : (
                    <select
                      id="workspace-select"
                      className="select select-bordered w-full"
                      value={selectedWorkspaceId ?? ''}
                      onChange={(e) => setSelectedWorkspaceId(e.target.value ? Number(e.target.value) : null)}
                      disabled={isLoading}
                    >
                      <option value="">選択してください</option>
                      {workspaces.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* 説明 */}
              <p className="text-base-content/70 text-sm">
                AIがダッシュボードの統計データを分析し、
                {scope === 'Organization' ? '組織全体' : (selectedWorkspaceName ?? 'ワークスペース')}
                の状況をお伝えします。分析タイプを選択してください。
              </p>

              {/* 分析タイプ選択 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisTypes.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={`btn btn-outline justify-start h-auto py-3 px-4 ${
                      selectedType === item.type ? 'btn-primary' : ''
                    }`}
                    onClick={() => setSelectedType(item.type)}
                    disabled={isLoading}
                  >
                    <span className={`${item.icon} size-5 shrink-0`} aria-hidden="true" />
                    <div className="text-left">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs opacity-70 font-normal">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="alert alert-soft alert-error">
                  <span className="icon-[mdi--alert-circle-outline] size-5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター（結果表示中は非表示） */}
        {!result && (
          <div className="flex gap-2 justify-end p-4 sm:p-6 border-t border-base-300 shrink-0">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={isLoading || !canAnalyze}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  分析中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--play] size-5" aria-hidden="true" />
                  分析を開始
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
