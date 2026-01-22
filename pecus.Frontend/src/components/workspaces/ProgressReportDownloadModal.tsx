'use client';

import { useEffect, useState } from 'react';
import { downloadWorkspaceProgressReport } from '@/actions/workspace';
import { useNotify } from '@/hooks/useNotify';

interface ProgressReportDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  workspaceCode: string;
  workspaceName: string;
}

/**
 * レポート出力モーダル
 * 期間を指定してJSONレポートをダウンロード
 */
export default function ProgressReportDownloadModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceCode,
  workspaceName,
}: ProgressReportDownloadModalProps) {
  const notify = useNotify();
  const [isDownloading, setIsDownloading] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  // デフォルト期間: 今月1日〜今日
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(formatDate(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDate(today));

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ファイルダウンロードのヘルパー関数
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    // バリデーション
    if (!fromDate || !toDate) {
      notify.error('開始日と終了日を指定してください。');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      notify.error('開始日は終了日以前に設定してください。');
      return;
    }

    // 期間が1年を超える場合はエラー
    const diffDays = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      notify.error('レポート期間は最大1年間です。');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadWorkspaceProgressReport(workspaceId, fromDate, toDate, includeArchived);

      if (result.success) {
        // サーバーから返されたファイル名を使用
        downloadFile(result.data.content, result.data.filename, 'application/json;charset=utf-8');
        notify.success('レポートを出力しました。');
        onClose();
      } else {
        notify.error(result.message || 'レポートの出力に失敗しました。');
      }
    } catch (error) {
      console.error('Download failed:', error);
      notify.error('レポートの出力に失敗しました。');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold">レポート出力</h2>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="閉じる"
            disabled={isDownloading}
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-base-content/70 mb-4">
            <span className="font-medium">{workspaceName}</span> のレポートをJSON形式で出力します。
          </p>

          <div className="space-y-4">
            {/* 期間選択 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="from-date">
                  <span className="label-text font-semibold">開始日</span>
                </label>
                <input
                  id="from-date"
                  type="date"
                  className="input input-bordered w-full"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate}
                  disabled={isDownloading}
                />
              </div>
              <div className="form-control">
                <label className="label" htmlFor="to-date">
                  <span className="label-text font-semibold">終了日</span>
                </label>
                <input
                  id="to-date"
                  type="date"
                  className="input input-bordered w-full"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                  max={formatDate(today)}
                  disabled={isDownloading}
                />
              </div>
            </div>

            {/* アーカイブ含むオプション */}
            <div className="form-control">
              <div className="flex items-center gap-3">
                <input
                  id="include-archived"
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  disabled={isDownloading}
                />
                <label htmlFor="include-archived" className="label-text cursor-pointer">
                  アーカイブ済みアイテムを含む
                </label>
              </div>
            </div>

            {/* 説明 */}
            <div className="text-xs text-base-content/60 bg-base-200 rounded-lg p-3">
              <p className="mb-1">
                <span className="icon-[mdi--information-outline] w-3.5 h-3.5 inline-block align-text-bottom mr-1" />
                レポートにはワークスペースのアイテムとタスクの詳細情報が含まれます。
              </p>
              <p>お客様への進捗報告や、外部ツールへのインポート用にご利用いただけます。</p>
            </div>
          </div>

          {/* ボタングループ */}
          <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-base-300">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isDownloading}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary gap-2" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  ダウンロード中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--download] w-4 h-4" aria-hidden="true" />
                  ダウンロード
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
