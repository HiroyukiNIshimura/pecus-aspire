'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { respondToLandingPageRecommendation } from '@/actions/profile';
import type { LandingPage } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getLandingPageDisplayName } from '@/utils/landingPage';

interface LandingPageRecommendationBannerProps {
  /** 推奨されたランディングページ */
  recommendedPage: LandingPage;
  /** 設定が更新されたときのコールバック（AppSettings再取得用） */
  onSettingsUpdated?: () => void;
}

/**
 * ランディングページ推奨バナー
 *
 * バッチ処理で計算されたランディングページ推奨をユーザーに提示し、
 * 受け入れまたは拒否を選択させる。
 */
export function LandingPageRecommendationBanner({
  recommendedPage,
  onSettingsUpdated,
}: LandingPageRecommendationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isPending, startTransition] = useTransition();
  const notify = useNotify();
  const router = useRouter();

  const recommendationName = getLandingPageDisplayName(recommendedPage);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await respondToLandingPageRecommendation('Accept');
      if (result.success) {
        notify.success(`起動ページを「${recommendationName}」に変更しました`);
        setIsVisible(false);
        onSettingsUpdated?.();
        router.refresh();
      } else {
        notify.error(result.message ?? '設定の変更に失敗しました');
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await respondToLandingPageRecommendation('Reject');
      if (result.success) {
        setIsVisible(false);
        onSettingsUpdated?.();
      } else {
        notify.error(result.message ?? '応答に失敗しました');
      }
    });
  };

  const handleGoToSettings = () => {
    setIsVisible(false);
    onSettingsUpdated?.();
    router.push('/profile/settings');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
      <div className="card bg-base-200 shadow-xl border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-start gap-3">
            <span className="icon-[mdi--lightbulb-on-outline] size-5 shrink-0 text-warning mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">ログイン後表示ページの変更をおすすめします</p>
              <p className="text-xs text-base-content/70 mt-1">
                最近の利用状況から「{recommendationName}」への変更をおすすめします
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 mt-3">
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleReject} disabled={isPending}>
              今は変更しない
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleGoToSettings}
              disabled={isPending}
            >
              設定へ
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleAccept} disabled={isPending}>
              {isPending ? <span className="loading loading-spinner loading-xs" /> : '変更する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPageRecommendationBanner;
