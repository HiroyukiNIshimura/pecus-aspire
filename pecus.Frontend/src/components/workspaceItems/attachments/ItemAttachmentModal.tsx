'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteWorkspaceItemAttachment,
  fetchWorkspaceItemAttachments,
  uploadWorkspaceItemAttachment,
} from '@/actions/workspaceItemAttachment';
import type { WorkspaceItemAttachmentResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import AttachmentDropzone from './AttachmentDropzone';
import AttachmentList, { type UploadingFile } from './AttachmentList';

interface ItemAttachmentModalProps {
  /** モーダルが開いているかどうか */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** ワークスペースID */
  workspaceId: number;
  /** アイテムID */
  itemId: number;
  /** タスクID（タスク詳細から開く場合） */
  taskId?: number;
  /** 初期添付ファイル一覧 */
  initialAttachments: WorkspaceItemAttachmentResponse[];
  /** 編集可能かどうか（Viewer以外はtrue） */
  canEdit: boolean;
  /** 現在のユーザーID（削除権限判定用） */
  currentUserId: number;
  /** アイテムオーナーID（オーナーは全ファイル削除可能） */
  itemOwnerId?: number;
  /** 添付ファイル数が変更された時のコールバック */
  onAttachmentCountChange?: (count: number) => void;
}

/**
 * アイテム添付ファイル管理モーダル
 */
export default function ItemAttachmentModal({
  isOpen,
  onClose,
  workspaceId,
  itemId,
  taskId,
  initialAttachments,
  canEdit,
  currentUserId,
  itemOwnerId,
  onAttachmentCountChange,
}: ItemAttachmentModalProps) {
  const notify = useNotify();

  const [attachments, setAttachments] = useState<WorkspaceItemAttachmentResponse[]>(initialAttachments);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  // タスクフィルター状態（アイテム詳細から開いた場合のみ使用）
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<number | 'all'>('all');

  // ユニークなタスクリストを抽出（アイテム詳細から開いた場合のみ）
  const taskOptions = useMemo(() => {
    if (taskId !== undefined) return []; // タスク詳細から開いた場合はフィルター不要
    const taskMap = new Map<number, { sequence: number; taskTypeName: string }>();
    for (const att of attachments) {
      if (att.task?.sequenceNumber) {
        taskMap.set(att.task.sequenceNumber, {
          sequence: att.task.sequenceNumber,
          taskTypeName: att.task.taskTypeName || '',
        });
      }
    }
    return Array.from(taskMap.values()).sort((a, b) => a.sequence - b.sequence);
  }, [attachments, taskId]);

  // フィルタリングされた添付ファイル一覧
  const filteredAttachments = useMemo(() => {
    if (taskId !== undefined || selectedTaskFilter === 'all') {
      return attachments;
    }
    return attachments.filter((a) => a.task?.sequenceNumber === selectedTaskFilter);
  }, [attachments, taskId, selectedTaskFilter]);

  // 初期データが変更されたら同期
  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  // 添付ファイル数の変更を通知
  useEffect(() => {
    onAttachmentCountChange?.(attachments.length);
  }, [attachments.length, onAttachmentCountChange]);

  // モーダルが開いている間はbodyのスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 削除可能かどうかを判定
  const canDeleteAttachment = useCallback(
    (attachment: WorkspaceItemAttachmentResponse): boolean => {
      if (!canEdit) return false;
      // オーナーは全ファイル削除可能
      if (itemOwnerId !== undefined && currentUserId === itemOwnerId) return true;
      // 自分がアップロードしたファイルのみ削除可能
      return attachment.uploadedByUserId === currentUserId;
    },
    [canEdit, currentUserId, itemOwnerId],
  );

  // 添付ファイル一覧を再取得
  const refreshAttachments = useCallback(async () => {
    const result = await fetchWorkspaceItemAttachments(workspaceId, itemId, taskId);
    if (result.success) {
      setAttachments(result.data);
    }
  }, [workspaceId, itemId, taskId]);

  // ファイルアップロード処理
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const tempId = `uploading-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // アップロード中の状態を追加
        setUploadingFiles((prev) => [...prev, { id: tempId, fileName: file.name, progress: 0 }]);

        try {
          // ファイルをArrayBufferに変換してからBlobを作成
          // これにより、ファイルハンドルの問題を回避（Excelで開いている等）
          // クライアント側でファイルを読み込むことで、NotReadableErrorをここでキャッチできる
          let fileBlob: Blob;
          try {
            const arrayBuffer = await file.arrayBuffer();
            fileBlob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });
          } catch (readError) {
            // ファイル読み取りエラー（Excelで開いている、クラウドストレージ等）
            if (
              readError instanceof Error &&
              (readError.name === 'NotReadableError' || readError.message.includes('could not be read'))
            ) {
              throw new Error(
                'ファイルを読み込めません。ファイルが他のアプリで開いていないか、クラウドストレージの場合はローカルにダウンロードしてから再度お試しください。',
              );
            }
            throw readError;
          }

          const formData = new FormData();
          formData.append('file', fileBlob, file.name);

          // 進捗を更新（Server Actionsでは実際の進捗は取得できないためシミュレーション）
          setUploadingFiles((prev) => prev.map((f) => (f.id === tempId ? { ...f, progress: 50 } : f)));

          // Server Actionを呼び出し
          const result = await uploadWorkspaceItemAttachment(workspaceId, itemId, formData, taskId);

          if (!result.success) {
            throw new Error(result.message || 'アップロードに失敗しました');
          }

          // アップロード完了 - サーバーから最新の添付ファイル一覧を再取得
          await refreshAttachments();
          notify.success(`「${file.name}」をアップロードしました。`);
        } catch (error) {
          console.error('Upload error:', error);
          notify.error(error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました。');
        } finally {
          // アップロード中の状態を削除
          setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
        }
      }
    },
    [workspaceId, itemId, taskId, notify, refreshAttachments],
  );

  // ファイル削除処理
  const handleDelete = useCallback(
    async (attachmentId: number) => {
      const result = await deleteWorkspaceItemAttachment(workspaceId, itemId, attachmentId);

      if (result.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        notify.success('ファイルを削除しました。');
      } else {
        notify.error(result.message || 'ファイルの削除に失敗しました。');
      }
    },
    [workspaceId, itemId, notify],
  );

  // エラーハンドリング
  const handleUploadError = useCallback(
    (message: string) => {
      notify.error(message);
    },
    [notify],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        {/* モーダルコンテナ */}
        <div
          className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <span className="icon-[mdi--paperclip] size-6" aria-hidden="true" />
                添付ファイル
                {attachments.length > 0 && <span className="badge badge-secondary badge-sm">{attachments.length}</span>}
              </h2>
              {/* タスクフィルター（アイテム詳細から開いた場合のみ表示） */}
              {taskId === undefined && taskOptions.length > 0 && (
                <select
                  className="select select-sm select-bordered"
                  value={selectedTaskFilter}
                  onChange={(e) => setSelectedTaskFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  aria-label="タスクで絞り込み"
                >
                  <option value="all">すべて</option>
                  {taskOptions.map((t) => (
                    <option key={t.sequence} value={t.sequence}>
                      T-{t.sequence}
                      {t.taskTypeName && `: ${t.taskTypeName}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <button type="button" onClick={onClose} className="btn btn-sm btn-circle btn-secondary" aria-label="閉じる">
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* ボディ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* ドロップゾーン（編集可能な場合のみ表示） */}
            {canEdit && (
              <AttachmentDropzone
                onFilesSelected={handleFilesSelected}
                onError={handleUploadError}
                disabled={!canEdit}
              />
            )}

            {/* ファイル一覧 */}
            <AttachmentList
              attachments={filteredAttachments}
              uploadingFiles={uploadingFiles}
              onDelete={handleDelete}
              canDelete={canDeleteAttachment}
              workspaceId={workspaceId}
              itemId={itemId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
