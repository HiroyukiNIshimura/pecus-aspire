'use client';

import { useState } from 'react';
import { updateUserSetting } from '@/actions/profile';
import AppHeader from '@/components/common/AppHeader';
import type { LandingPage, UserSettingResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import { LANDING_PAGE_OPTIONS } from '@/utils/landingPage';

interface UserSettingsClientProps {
  initialUser: UserInfo;
  initialSettings: UserSettingResponse;
  fetchError?: string | null;
}

export default function UserSettingsClient({ initialUser, initialSettings, fetchError }: UserSettingsClientProps) {
  const notify = useNotify();
  const [user] = useState<UserInfo>(initialUser);
  const [settings, setSettings] = useState<UserSettingResponse>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setSettings({
      ...settings,
      [name]: value === '' ? undefined : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateUserSetting({
        canReceiveEmail: settings.canReceiveEmail,
        canReceiveRealtimeNotification: settings.canReceiveRealtimeNotification,
        timeZone: settings.timeZone,
        language: settings.language,
        landingPage: settings.landingPage as LandingPage | undefined,
        rowVersion: settings.rowVersion ?? 0,
      });

      if (result.success) {
        notify.success('設定を保存しました');
        // 最新のRowVersionで更新
        setSettings(result.data);
      } else {
        notify.error(result.message || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      notify.error('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userInfo={user} hideSettingsMenu={true} />
      <main className="flex-1 p-6 bg-base-100">
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">ユーザー設定</h1>
            <p className="text-base-content/70">通知設定などの個人設定を管理してください</p>
          </div>

          {fetchError && (
            <div className="alert alert-soft alert-error mb-4">
              <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
              <span>{fetchError}</span>
            </div>
          )}

          <div className="card bg-base-200">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-control">
                  <label htmlFor="canReceiveEmail" className="label cursor-pointer justify-start gap-4">
                    <input
                      id="canReceiveEmail"
                      name="canReceiveEmail"
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={!!settings.canReceiveEmail}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <div>
                      <span className="label-text font-semibold">メール通知を受信する</span>
                      <p className="text-sm text-base-content/70 mt-1">システムからの通知メールを受信します</p>
                    </div>
                  </label>
                </div>

                <div className="form-control">
                  <label htmlFor="landingPage" className="label">
                    <span className="label-text font-semibold">ログイン後の表示ページ</span>
                  </label>
                  <select
                    id="landingPage"
                    name="landingPage"
                    className="select select-bordered w-full"
                    value={settings.landingPage ?? 'Dashboard'}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    {LANDING_PAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-base-content/70 mt-1">
                    ログイン後に最初に表示されるページを選択できます
                  </p>
                </div>

                {/* 必要に応じて他の設定項目を追加 */}

                <div className="flex justify-end gap-2 pt-4">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
