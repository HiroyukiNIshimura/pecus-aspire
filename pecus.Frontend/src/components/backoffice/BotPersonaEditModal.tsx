'use client';

import { useEffect, useState } from 'react';
import type { BackOfficeBotResponse, BackOfficeUpdateBotPersonaRequest } from '@/connectors/api/pecus';

interface BotPersonaEditModalProps {
  isOpen: boolean;
  bot: BackOfficeBotResponse | null;
  onClose: () => void;
  onConfirm: (
    botId: number,
    request: BackOfficeUpdateBotPersonaRequest,
  ) => Promise<{ success: boolean; message?: string }>;
}

export default function BotPersonaEditModal({ isOpen, bot, onClose, onConfirm }: BotPersonaEditModalProps) {
  const [persona, setPersona] = useState('');
  const [constraint, setConstraint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bot) {
      setPersona(bot.persona || '');
      setConstraint(bot.constraint || '');
      setSubmitError(null);
    }
  }, [isOpen, bot]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isSubmitting || !bot) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await onConfirm(bot.id, {
        persona: persona.trim() || undefined,
        constraint: constraint.trim() || undefined,
        rowVersion: bot.rowVersion,
      });
      if (!result.success) {
        setSubmitError(result.message || 'ボットの更新に失敗しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !bot) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <span className="icon-[mdi--robot-outline] w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{bot.name} の設定</h2>
              <p className="text-sm text-base-content/70">ボットのペルソナと行動指針を編集します</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="form-control mb-6">
            <label className="label" htmlFor="bot-persona">
              <span className="label-text font-semibold">ペルソナ</span>
            </label>
            <p className="text-sm text-base-content/70 mb-2">
              ボットの性格や役割を設定します。ボットがどのような口調や態度で応答するかを定義してください。
            </p>
            <textarea
              id="bot-persona"
              className="textarea textarea-bordered w-full h-40 resize-y"
              placeholder="例: あなたは親切で丁寧なアシスタントです。ユーザーの質問に対して、わかりやすく簡潔に回答してください。"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              disabled={isSubmitting}
              maxLength={4000}
            />
            <div className="label">
              <span className="label-text-alt">{persona.length} / 4000文字</span>
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label" htmlFor="bot-constraint">
              <span className="label-text font-semibold">行動指針（制約条件）</span>
            </label>
            <p className="text-sm text-base-content/70 mb-2">
              ボットが守るべきルールや禁止事項を設定します。不適切な応答を防ぐための制約を定義してください。
            </p>
            <textarea
              id="bot-constraint"
              className="textarea textarea-bordered w-full h-40 resize-y"
              placeholder="例: 個人情報を聞き出さない。攻撃的な言葉を使わない。わからないことは正直にわからないと答える。"
              value={constraint}
              onChange={(e) => setConstraint(e.target.value)}
              disabled={isSubmitting}
              maxLength={4000}
            />
            <div className="label">
              <span className="label-text-alt">{constraint.length} / 4000文字</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-base-300 shrink-0">
          {submitError && (
            <div className="alert alert-soft alert-error mb-4">
              <span className="icon-[mdi--alert-circle-outline] size-5" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isSubmitting}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  保存中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--content-save-outline] w-5 h-5" aria-hidden="true" />
                  保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
