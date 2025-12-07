'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/common/AppHeader';
import { detect404ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { DeviceResponse, MasterSkillResponse, PendingEmailChangeResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import BasicInfoTab from './BasicInfoTab';
import DevicesTab from './DevicesTab';
import SecurityTab from './SecurityTab';
import SkillsTab from './SkillsTab';

interface ProfileSettingsClientProps {
  initialUser: UserInfo;
  initialPendingEmailChange: PendingEmailChangeResponse | null;
  masterSkills: MasterSkillResponse[];
  fetchError?: string | null;
}

type TabType = 'basic' | 'skills' | 'security' | 'devices';

export default function ProfileSettingsClient({
  initialUser,
  initialPendingEmailChange,
  masterSkills,
  fetchError,
}: ProfileSettingsClientProps) {
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [user, setUser] = useState<UserInfo>(initialUser);
  const [pendingEmailChange, _setPendingEmailChange] = useState<PendingEmailChangeResponse | null>(
    initialPendingEmailChange,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceResponse[] | null>(null);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const [isDevicesFetched, setIsDevicesFetched] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: '基本情報' },
    { id: 'skills', label: 'スキル' },
    { id: 'security', label: 'セキュリティ' },
    { id: 'devices', label: '接続端末' },
  ];

  // 接続端末一覧を遅延取得（タブが初めて開かれたとき）
  useEffect(() => {
    const fetchDevices = async () => {
      setIsDevicesLoading(true);
      setDevicesError(null);
      try {
        const res = await fetch('/api/profile/devices', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          const error = new Error(`Failed to fetch devices: ${res.status}`) as Error & { status?: number };
          error.status = res.status;
          throw error;
        }

        const result = (await res.json()) as DeviceResponse[];
        setDevices(result);
      } catch (error) {
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? (error as { status?: number }).status
            : undefined;
        const notFound = status === 404 || detect404ValidationError(error);

        if (notFound) {
          setDevices([]);
          return;
        }

        const parsed = parseErrorResponse(error, '接続端末の取得に失敗しました');
        setDevicesError(parsed.message);
        // エラー時も再試行ループを避けるため空配列をセット
        setDevices([]);
      } finally {
        setIsDevicesLoading(false);
        setIsDevicesFetched(true);
      }
    };

    if (activeTab === 'devices' && !isDevicesFetched && !isDevicesLoading) {
      fetchDevices();
    }
  }, [activeTab, isDevicesFetched, isDevicesLoading]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userInfo={user} hideProfileMenu={true} />
      <main className="flex-1 p-6 bg-base-100">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">プロフィール設定</h1>
            <p className="text-base-content/70">アカウント情報とセキュリティ設定を管理してください</p>
          </div>
          {fetchError && (
            <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
              {fetchError}
            </div>
          )}
          <div className="mb-6">
            <div className="flex border-b border-base-300">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary -mb-0.5'
                      : 'text-base-content/70 hover:text-base-content'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* タブコンテンツ */}
          <div className="bg-base-100 rounded-lg shadow-md p-8">
            {activeTab === 'basic' && (
              <BasicInfoTab
                user={user}
                onUpdate={setUser}
                notify={notify}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === 'skills' && (
              <SkillsTab
                initialSkillIds={user.skills?.map((s) => s.id) || []}
                masterSkills={masterSkills}
                notify={notify}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === 'security' && (
              <SecurityTab
                currentEmail={user.email || ''}
                pendingEmailChange={pendingEmailChange}
                notify={notify}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === 'devices' && (
              <DevicesTab devices={devices ?? []} isLoading={isDevicesLoading} error={devicesError} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
