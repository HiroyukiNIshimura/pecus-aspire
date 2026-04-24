'use client';

import { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import {
  createPersonalItemNote,
  deletePersonalItemNote,
  fetchPersonalItemNote,
  updatePersonalItemNote,
} from '@/actions/personalItemNote';
import type { PersonalItemNoteResponse } from '@/connectors/api/pecus';
import { formatDateTime } from '@/libs/utils/date';

type Mode = 'loading' | 'view' | 'creating' | 'editing' | 'confirm-delete';

interface PersonalItemNoteDrawerProps {
  workspaceId: number;
  itemId: number;
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  onNoteStateChange?: (hasNote: boolean) => void;
}

export default function PersonalItemNoteDrawer({
  workspaceId,
  itemId,
  isOpen,
  isClosing,
  onClose,
  onNoteStateChange,
}: PersonalItemNoteDrawerProps) {
  const [mode, setMode] = useState<Mode>('loading');
  const [note, setNote] = useState<PersonalItemNoteResponse | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNote = useCallback(async () => {
    setMode('loading');
    setNote(null);
    setError(null);
    const result = await fetchPersonalItemNote(workspaceId, itemId);
    if (result.success) {
      setNote(result.data);
      onNoteStateChange?.(result.data !== null);
    } else {
      setError(result.message);
    }
    setMode('view');
  }, [workspaceId, itemId, onNoteStateChange]);

  useEffect(() => {
    if (isOpen) {
      loadNote();
    }
  }, [isOpen, loadNote]);

  const handleStartCreate = () => {
    setDraftContent('');
    setError(null);
    setMode('creating');
  };

  const handleStartEdit = () => {
    setDraftContent(note?.content ?? '');
    setError(null);
    setMode('editing');
  };

  const handleCancel = () => {
    setError(null);
    setMode('view');
  };

  const handleSave = async () => {
    if (!draftContent.trim()) return;
    setIsSaving(true);
    setError(null);

    const result = note
      ? await updatePersonalItemNote(workspaceId, itemId, draftContent)
      : await createPersonalItemNote(workspaceId, itemId, draftContent);

    setIsSaving(false);

    if (result.success) {
      setNote(result.data);
      onNoteStateChange?.(true);
      setMode('view');
    } else {
      setError(result.message);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError(null);
    const result = await deletePersonalItemNote(workspaceId, itemId);
    setIsSaving(false);
    if (result.success) {
      setNote(null);
      onNoteStateChange?.(false);
    } else {
      setError(result.message);
    }
    setMode('view');
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>

      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
        style={{
          animation: isClosing ? 'fadeOut 0.25s ease-out' : 'fadeIn 0.2s ease-out',
        }}
      />

      {/* ドロワー本体 */}
      <div
        className="fixed top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 overflow-y-auto flex flex-col transition-transform duration-300 ease-out"
        role="dialog"
        tabIndex={-1}
        style={{
          animation: isClosing ? 'slideOutRight 0.25s ease-in' : 'slideInRight 0.3s ease-out',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <div className="flex items-center gap-1">
            <span className="icon-[mdi--lock-outline] w-4 h-4 text-base-content/50" aria-hidden="true" />
            <h3 className="text-lg font-bold">個人メモ</h3>
            <span className="text-xs text-base-content/50 ml-1">あなただけに表示</span>
          </div>
          <button type="button" className="btn btn-secondary btn-circle btn-sm" aria-label="閉じる" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 p-4">
          {mode === 'loading' && <span className="loading loading-spinner loading-sm" />}

          {mode === 'view' && !note && !error && (
            <button
              type="button"
              onClick={handleStartCreate}
              className="btn btn-secondary btn-sm gap-1 text-base-content/60"
            >
              <span className="icon-[mdi--plus] w-4 h-4" aria-hidden="true" />
              メモを追加
            </button>
          )}

          {mode === 'view' && note && (
            <div>
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 bg-base-200 rounded-lg p-3">
                <Markdown remarkPlugins={[remarkBreaks]}>{note.content ?? ''}</Markdown>
              </div>
              {/* 更新日時 */}
              {note.updatedAt && (
                <div>
                  <span className="text-xs text-base-content/70">更新日時</span>
                  <p className="text-xs font-semibold">{formatDateTime(note.updatedAt)}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={handleStartEdit} className="btn btn-secondary btn-xs gap-1">
                  <span className="icon-[mdi--pencil] w-3.5 h-3.5" aria-hidden="true" />
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('confirm-delete');
                  }}
                  className="btn btn-secondary btn-xs gap-1 text-error"
                >
                  <span className="icon-[mdi--delete-outline] w-3.5 h-3.5" aria-hidden="true" />
                  削除
                </button>
              </div>
            </div>
          )}

          {mode === 'confirm-delete' && (
            <div className="bg-base-200 rounded-lg p-3">
              <p className="text-sm mb-2">個人メモを削除しますか？</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleDelete} disabled={isSaving} className="btn btn-error btn-xs">
                  {isSaving ? <span className="loading loading-spinner loading-xs" /> : '削除'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  disabled={isSaving}
                  className="btn btn-secondary btn-xs"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {(mode === 'creating' || mode === 'editing') && (
            <div>
              <textarea
                className="textarea textarea-bordered w-full text-sm resize-y min-h-30"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Markdownで記述できます"
                disabled={isSaving}
              />
              {error && <p className="text-error text-xs mt-1">{error}</p>}
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={handleCancel} disabled={isSaving} className="btn btn-secondary btn-sm">
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !draftContent.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {isSaving ? <span className="loading loading-spinner loading-xs" /> : '保存'}
                </button>
              </div>
            </div>
          )}

          {mode === 'view' && error && <p className="text-error text-xs">{error}</p>}
        </div>
      </div>
    </>
  );
}
