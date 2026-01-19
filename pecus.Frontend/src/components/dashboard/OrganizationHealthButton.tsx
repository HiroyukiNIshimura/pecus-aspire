'use client';

import { useState } from 'react';
import { useIsAiEnabled } from '@/providers/AppSettingsProvider';
import HealthAnalysisModal from './HealthAnalysisModal';

/**
 * 組織健康診断ボタン
 * クリックすると健康診断モーダルを表示する
 * AI機能が無効の場合は非表示
 */
export default function OrganizationHealthButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAiEnabled = useIsAiEnabled();

  // AI機能が無効の場合は非表示
  if (!isAiEnabled) return null;

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() => setIsModalOpen(true)}
        aria-label="健康診断を表示"
      >
        <span className="icon-[mdi--stethoscope] size-4" aria-hidden="true" />
        <span className="hidden sm:inline">健康診断</span>
      </button>

      <HealthAnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
