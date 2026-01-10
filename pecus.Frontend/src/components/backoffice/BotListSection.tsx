'use client';

import { useEffect, useState, useTransition } from 'react';
import { getBackOfficeOrganizationBots, updateBackOfficeBotPersona } from '@/actions/backoffice/organizations';
import type { BackOfficeBotResponse, BackOfficeUpdateBotPersonaRequest } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import BotPersonaEditModal from './BotPersonaEditModal';

interface BotListSectionProps {
  organizationId: number;
}

const botTypeLabels: Record<string, string> = {
  SystemBot: 'システムボット',
  ChatBot: 'チャットボット',
  CustomBot: 'カスタムボット',
};

export default function BotListSection({ organizationId }: BotListSectionProps) {
  const [bots, setBots] = useState<BackOfficeBotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<BackOfficeBotResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const notify = useNotify();

  useEffect(() => {
    const fetchBots = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getBackOfficeOrganizationBots(organizationId);
      if (result.success) {
        setBots(result.data);
      } else {
        setError(result.message || 'ボット一覧の取得に失敗しました');
      }
      setIsLoading(false);
    };

    fetchBots();
  }, [organizationId]);

  const handleEditClick = (bot: BackOfficeBotResponse) => {
    setSelectedBot(bot);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedBot(null);
  };

  const handleUpdateBot = async (
    botId: number,
    request: BackOfficeUpdateBotPersonaRequest,
  ): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await updateBackOfficeBotPersona(organizationId, botId, request);
        if (result.success) {
          setBots((prev) => prev.map((b) => (b.id === botId ? result.data : b)));
          setIsEditModalOpen(false);
          setSelectedBot(null);
          notify.success('ボットの設定を更新しました');
          resolve({ success: true });
        } else {
          resolve({ success: false, message: result.message });
        }
      });
    });
  };

  if (isLoading) {
    return (
      <div className="card bg-base-200 mt-6">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <span className="icon-[mdi--robot-outline] w-5 h-5" aria-hidden="true" />
            ボット一覧
          </h3>
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-200 mt-6">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <span className="icon-[mdi--robot-outline] w-5 h-5" aria-hidden="true" />
            ボット一覧
          </h3>
          <div className="alert alert-soft alert-error">
            <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card bg-base-200 mt-6">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <span className="icon-[mdi--robot-outline] w-5 h-5" aria-hidden="true" />
            ボット一覧
            <span className="badge badge-secondary badge-sm ml-2">{bots.length}件</span>
          </h3>

          {bots.length === 0 ? (
            <div className="text-base-content/70 py-4 text-center">この組織にはボットが登録されていません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-auto">
                <thead>
                  <tr>
                    <th className="w-48">ボット名</th>
                    <th className="w-32">種類</th>
                    <th className="w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((bot) => (
                    <tr key={bot.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {bot.iconUrl ? (
                            <img src={bot.iconUrl} alt={bot.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="icon-[mdi--robot] w-5 h-5 text-primary" aria-hidden="true" />
                            </div>
                          )}
                          <span className="font-medium">{bot.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm">{botTypeLabels[bot.type] || bot.type}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditClick(bot)}
                          disabled={isPending}
                          aria-label={`${bot.name}を編集`}
                        >
                          <span className="icon-[mdi--pencil] w-4 h-4" aria-hidden="true" />
                          編集
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BotPersonaEditModal
        isOpen={isEditModalOpen}
        bot={selectedBot}
        onClose={handleCloseModal}
        onConfirm={handleUpdateBot}
      />
    </>
  );
}
