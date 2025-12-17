'use client';

import { useEffect, useState } from 'react';
import { getWorkspaceDetail, setWorkspaceSkills } from '@/actions/workspace';
import MultiSelectDropdown from '@/components/common/filters/MultiSelectDropdown';
import type { MasterSkillResponse, WorkspaceFullDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

interface EditWorkspaceSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedWorkspace: WorkspaceFullDetailResponse) => void;
  workspace: WorkspaceFullDetailResponse | null;
  skills: MasterSkillResponse[];
}

export default function EditWorkspaceSkillsModal({
  isOpen,
  onClose,
  onSuccess,
  workspace,
  skills,
}: EditWorkspaceSkillsModalProps) {
  const notify = useNotify();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 選択中のスキルID
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);

  // 初期スキルID（変更検出用）
  const [initialSkillIds, setInitialSkillIds] = useState<number[]>([]);

  // スキルが変更されたかどうか
  const skillsChanged =
    selectedSkillIds.length !== initialSkillIds.length || !selectedSkillIds.every((id) => initialSkillIds.includes(id));

  // モーダルを開いた際にワークスペースのスキルを設定
  useEffect(() => {
    if (isOpen && workspace) {
      const currentSkillIds = workspace.skills?.map((s) => s.id) || [];
      setSelectedSkillIds(currentSkillIds);
      setInitialSkillIds(currentSkillIds);
      setServerError(null);
    }
  }, [isOpen, workspace]);

  // モーダルを閉じる際にリセット
  useEffect(() => {
    if (!isOpen) {
      setSelectedSkillIds([]);
      setInitialSkillIds([]);
      setServerError(null);
    }
  }, [isOpen]);

  /** スキル選択をリセット */
  const handleReset = () => {
    setSelectedSkillIds(initialSkillIds);
  };

  /** スキルを更新 */
  const handleSubmit = async () => {
    if (!workspace || !skillsChanged) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await setWorkspaceSkills(workspace.id, selectedSkillIds, workspace.rowVersion);

      if (result.success) {
        // 更新後にワークスペース詳細を再取得して最新のrowVersionを取得
        const detailResult = await getWorkspaceDetail(workspace.id);

        if (detailResult.success) {
          notify.success('スキルを更新しました。');
          onSuccess(detailResult.data);
          onClose();
        } else {
          // スキル更新は成功したが、詳細取得に失敗した場合
          // ローカルでスキルだけ更新して通知（rowVersionは古いまま）
          const updatedWorkspace: WorkspaceFullDetailResponse = {
            ...workspace,
            skills: selectedSkillIds.map((id) => {
              const skill = skills.find((s) => s.id === id);
              return { id, name: skill?.name || '' };
            }),
          };
          notify.success('スキルを更新しました。');
          notify.error('最新情報の取得に失敗しました。ページをリロードしてください。');
          onSuccess(updatedWorkspace);
          onClose();
        }
      } else {
        const errorMessage =
          result.error === 'conflict'
            ? result.message || '別のユーザーが同時に更新しました。ページをリロードしてください。'
            : result.message || 'スキルの更新に失敗しました。';
        setServerError(errorMessage);
        notify.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to update skills:', error);
      const errorMessage = 'スキルの更新中にエラーが発生しました。';
      setServerError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="icon-[mdi--lightbulb-outline] size-6" aria-hidden="true" />
            必要スキル設定
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* サーバーエラー表示 */}
          {serverError && (
            <div className="alert alert-soft alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* ワークスペース情報 */}
          {workspace && (
            <div className="mb-6 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center gap-3">
                {workspace.genreIcon && (
                  <img
                    src={`/icons/genres/${workspace.genreIcon}.svg`}
                    alt={workspace.genreName || 'ジャンルアイコン'}
                    title={workspace.genreName || 'ジャンル'}
                    className="w-10 h-10 flex-shrink-0"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg">{workspace.name}</h3>
                  {workspace.code && <code className="text-sm text-base-content/70">{workspace.code}</code>}
                </div>
              </div>
            </div>
          )}

          {/* 説明文 */}
          <p className="text-base-content/70 mb-4">
            このワークスペースで必要とされるスキルを設定してください。
            設定したスキルは、メンバーのスキルマッチングやタスクの割り当てに活用されます。
          </p>

          {/* スキル選択 */}
          <div className="mb-6">
            <MultiSelectDropdown
              label="必要なスキル"
              items={skills.map((s) => ({ id: s.id, name: s.name }))}
              selectedIds={selectedSkillIds}
              onSelectionChange={setSelectedSkillIds}
              disabled={isSubmitting}
              placeholder="スキルを選択してください"
              emptyMessage="利用可能なスキルがありません"
              badgeColor="accent"
              changeMessage={skillsChanged ? '✓ スキルが変更されています' : undefined}
              defaultOpen
            />
          </div>

          {/* ボタングループ */}
          <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
            {skillsChanged && (
              <button type="button" className="btn btn-default" onClick={handleReset} disabled={isSubmitting}>
                リセット
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !skillsChanged}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  更新中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--lightbulb-outline] w-5 h-5" aria-hidden="true" />
                  更新
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
