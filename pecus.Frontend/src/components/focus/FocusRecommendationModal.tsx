'use client';

import { useEffect, useState } from 'react';
import { fetchFocusRecommendation } from '@/actions/focus';
import type { FocusRecommendationResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import FocusTaskCard from './FocusTaskCard';
import WaitingTaskCard from './WaitingTaskCard';

interface FocusRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * やることピックアップモーダル
 * ユーザーが今すぐ取り組むべきタスクと待機中のタスクを表示
 */
export default function FocusRecommendationModal({ isOpen, onClose }: FocusRecommendationModalProps) {
  const [data, setData] = useState<FocusRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  // モーダルが開いたときにデータを取得
  useEffect(() => {
    if (isOpen && !data) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchFocusRecommendation();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        notify.error(!result.success ? result.message : 'データの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to load focus recommendation:', error);
      notify.error('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* モーダルオーバーレイ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        {/* モーダルコンテナ */}
        <div className="bg-base-100 rounded-box shadow-xl w-full max-w-4xl sm:max-w-6xl max-h-[90vh] flex flex-col">
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span className="icon-[mdi--target] size-5 sm:size-6" aria-hidden="true" />
              やることピックアップ
            </h2>
            <button
              type="button"
              className="btn btn-sm btn-circle"
              onClick={handleClose}
              disabled={loading}
              aria-label="閉じる"
            >
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* 統計情報 */}
                  <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                    <div className="stat">
                      <div className="stat-figure text-primary">
                        <span className="icon-[mdi--clipboard-check-outline] w-8 h-8" aria-hidden="true" />
                      </div>
                      <div className="stat-title">総タスク数</div>
                      <div className="stat-value text-primary">{data.totalTaskCount}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-figure text-success">
                        <span className="icon-[mdi--play-circle-outline] w-8 h-8" aria-hidden="true" />
                      </div>
                      <div className="stat-title">着手可能</div>
                      <div className="stat-value text-success">{data.focusTasks.length}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-figure text-warning">
                        <span className="icon-[mdi--pause-circle-outline] w-8 h-8" aria-hidden="true" />
                      </div>
                      <div className="stat-title">待機中</div>
                      <div className="stat-value text-warning">{data.waitingTasks.length}</div>
                    </div>
                  </div>

                  {/* 今すぐ取り組むべきタスク */}
                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <span className="icon-[mdi--rocket-launch] w-6 h-6 text-success" aria-hidden="true" />
                      今すぐ取り組むべき
                    </h3>
                    {data.focusTasks.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {data.focusTasks.map((task) => (
                          <FocusTaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="card bg-base-200 shadow-sm">
                        <div className="card-body items-center text-center py-8">
                          <span
                            className="icon-[mdi--check-circle-outline] w-12 h-12 text-success mb-2"
                            aria-hidden="true"
                          />
                          <p className="text-base-content/70">着手可能なタスクはありません</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 今は着手できないタスク */}
                  {data.waitingTasks.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        <span className="icon-[mdi--pause-circle] w-6 h-6 text-warning" aria-hidden="true" />
                        今は着手できない（先行タスク待ち）
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {data.waitingTasks.map((task) => (
                          <WaitingTaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body items-center text-center py-12">
                    <span className="icon-[mdi--alert-circle-outline] w-12 h-12 text-error mb-2" aria-hidden="true" />
                    <p className="text-base-content/70">データの読み込みに失敗しました</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
