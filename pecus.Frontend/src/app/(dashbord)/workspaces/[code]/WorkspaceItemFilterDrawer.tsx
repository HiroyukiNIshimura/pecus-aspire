'use client';

import { useState } from 'react';
import type { WorkspaceDetailUserResponse } from '@/connectors/api/pecus';

export interface WorkspaceItemFilters {
  assigneeId?: number | null;
  status?: string | null;
  priority?: string | null;
  dueDateFrom?: string | null;
  dueDateTo?: string | null;
}

interface WorkspaceItemFilterDrawerProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  members?: WorkspaceDetailUserResponse[];
  currentFilters: WorkspaceItemFilters;
  onApplyFilters: (filters: WorkspaceItemFilters) => void;
}

export default function WorkspaceItemFilterDrawer({
  isOpen,
  isClosing,
  onClose,
  members = [],
  currentFilters,
  onApplyFilters,
}: WorkspaceItemFilterDrawerProps) {
  const [filters, setFilters] = useState<WorkspaceItemFilters>(currentFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: WorkspaceItemFilters = {
      assigneeId: null,
      status: null,
      priority: null,
      dueDateFrom: null,
      dueDateTo: null,
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length;

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
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
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

      {/* ドローワー本体（左から表示） */}
      <div
        id="workspace-item-filter-drawer"
        className="fixed top-0 left-0 h-full w-80 bg-base-100 shadow-xl z-50 overflow-y-auto flex flex-col transition-transform duration-300 ease-out"
        role="dialog"
        tabIndex={-1}
        style={{
          animation: isClosing ? 'slideOutLeft 0.25s ease-in' : 'slideInLeft 0.3s ease-out',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h3 className="text-lg font-bold">詳細フィルター</h3>
            {activeFilterCount > 0 && <span className="badge badge-primary badge-sm">{activeFilterCount}</span>}
          </div>
          <button type="button" className="btn btn-ghost btn-circle btn-sm" aria-label="閉じる" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 p-4 space-y-4">
          {/* 担当者フィルター */}
          <div className="form-control">
            <label htmlFor="filter-assignee" className="label">
              <span className="label-text font-semibold">担当者</span>
            </label>
            <select
              id="filter-assignee"
              value={filters.assigneeId ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, assigneeId: e.target.value ? parseInt(e.target.value, 10) : null })
              }
              className="select select-bordered select-sm"
            >
              <option value="">すべて</option>
              <option value="-1">未割当</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.userName}
                </option>
              ))}
            </select>
          </div>

          {/* ステータスフィルター */}
          <div className="form-control">
            <label htmlFor="filter-status" className="label">
              <span className="label-text font-semibold">ステータス</span>
            </label>
            <select
              id="filter-status"
              value={filters.status ?? ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
              className="select select-bordered select-sm"
            >
              <option value="">すべて</option>
              <option value="open">オープン</option>
              <option value="in_progress">進行中</option>
              <option value="review">レビュー中</option>
              <option value="done">完了</option>
              <option value="closed">クローズ</option>
            </select>
          </div>

          {/* 優先度フィルター */}
          <div className="form-control">
            <label htmlFor="filter-priority" className="label">
              <span className="label-text font-semibold">優先度</span>
            </label>
            <select
              id="filter-priority"
              value={filters.priority ?? ''}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value || null })}
              className="select select-bordered select-sm"
            >
              <option value="">すべて</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">緊急</option>
            </select>
          </div>

          <div className="divider my-2">期限</div>

          {/* 期限（開始） */}
          <div className="form-control">
            <label htmlFor="filter-due-from" className="label">
              <span className="label-text font-semibold">期限（開始）</span>
            </label>
            <input
              id="filter-due-from"
              type="date"
              value={filters.dueDateFrom ?? ''}
              onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value || null })}
              className="input input-bordered input-sm"
            />
          </div>

          {/* 期限（終了） */}
          <div className="form-control">
            <label htmlFor="filter-due-to" className="label">
              <span className="label-text font-semibold">期限（終了）</span>
            </label>
            <input
              id="filter-due-to"
              type="date"
              value={filters.dueDateTo ?? ''}
              onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value || null })}
              className="input input-bordered input-sm"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-4 border-t border-base-300 bg-base-100 sticky bottom-0">
          <button type="button" className="btn btn-outline btn-sm flex-1" onClick={handleReset}>
            リセット
          </button>
          <button type="button" className="btn btn-primary btn-sm flex-1" onClick={handleApply}>
            適用
          </button>
        </div>
      </div>
    </>
  );
}
