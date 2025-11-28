'use client';

import { useState } from 'react';
import { setUserSkills } from '@/actions/profile';
import type { MasterSkillResponse } from '@/connectors/api/pecus';

interface SkillsTabProps {
  initialSkillIds: number[];
  masterSkills: MasterSkillResponse[];
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function SkillsTab({ initialSkillIds, masterSkills, notify, isLoading, setIsLoading }: SkillsTabProps) {
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(new Set(initialSkillIds));
  const [isOpen, setIsOpen] = useState(false);

  const handleSkillToggle = (skillId: number) => {
    setSelectedSkillIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  const handleSkillsSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await setUserSkills({
        skillIds: Array.from(selectedSkillIds),
      });

      if (result.success) {
        notify.success('スキルを更新しました。');
      } else {
        notify.error(result.message || 'スキル更新に失敗しました');
      }
    } catch (error) {
      console.error('Skill update error:', error);
      notify.error('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSkills = masterSkills.filter((skill) => selectedSkillIds.has(skill.id));

  return (
    <div className="space-y-6 bg-base-100">
      {/* スキル選択ドロップダウン */}
      <div className="form-control">
        <div className="label">
          <span className="label-text font-semibold text-base-content">スキル選択</span>
        </div>
        <div className="dropdown w-full">
          <button
            type="button"
            className="btn btn-outline w-full justify-start"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
          >
            <span className="flex-1 text-left">
              {selectedSkillIds.size > 0 ? `${selectedSkillIds.size}個のスキルを選択` : 'スキルを選択'}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          {isOpen && (
            <div className="dropdown-content bg-base-100 border border-base-300 rounded-lg shadow-lg w-full z-50 max-h-80 overflow-y-auto">
              <div className="p-4 space-y-2">
                {masterSkills.map((skill) => (
                  <label
                    key={skill.id}
                    className="flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedSkillIds.has(skill.id)}
                      onChange={() => handleSkillToggle(skill.id)}
                      disabled={isLoading}
                    />
                    <span className="text-sm">{skill.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 選択されたスキルのバッジ表示 */}
      {selectedSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">選択されたスキル:</p>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <div key={skill.id} className="badge badge-lg badge-primary flex items-center gap-2">
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => handleSkillToggle(skill.id)}
                  disabled={isLoading}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${skill.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <div className="flex justify-end mt-6">
        <button type="button" onClick={handleSkillsSubmit} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              保存中...
            </>
          ) : (
            'スキルを保存'
          )}
        </button>
      </div>
    </div>
  );
}
