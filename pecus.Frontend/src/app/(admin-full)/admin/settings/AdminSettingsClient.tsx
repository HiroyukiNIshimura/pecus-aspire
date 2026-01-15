'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAvailableModels, updateOrganizationSetting } from '@/actions/admin/organizations';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ConflictAlert } from '@/components/common/feedback/ConflictAlert';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import { Slider } from '@/components/common/filters/Slider';
import type {
  AvailableModelResponse,
  HelpNotificationTarget,
  OrganizationResponse,
  OrganizationSettingResponse,
} from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import {
  type OrganizationSettingInput,
  organizationSettingSchemaWithRules,
} from '@/schemas/organizationSettingSchemas';

interface AdminSettingsClientProps {
  organization: OrganizationResponse;
  fetchError: string | null;
}

const normalizeVendor = (value: unknown): OrganizationSettingResponse['generativeApiVendor'] => {
  if (typeof value === 'string') {
    switch (value) {
      case 'None':
      case 'OpenAi':
      case 'Anthropic':
      case 'GoogleGemini':
      case 'DeepSeek':
        return value;
      default:
        return 'None';
    }
  }

  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'None';
      case 1:
        return 'OpenAi';
      case 2:
        return 'Anthropic';
      case 3:
        return 'GoogleGemini';
      case 4:
        return 'DeepSeek';
      default:
        return 'None';
    }
  }

  return 'None';
};

const normalizePlan = (value: unknown): OrganizationSettingResponse['plan'] => {
  if (typeof value === 'string') {
    switch (value) {
      case 'Unknown':
      case 'Free':
      case 'Standard':
      case 'Enterprise':
        return value;
      default:
        return 'Unknown';
    }
  }

  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'Unknown';
      case 1:
        return 'Free';
      case 2:
        return 'Standard';
      case 3:
        return 'Enterprise';
      default:
        return 'Unknown';
    }
  }

  return 'Unknown';
};

const normalizeWorkspaceMode = (value: unknown): OrganizationSettingResponse['defaultWorkspaceMode'] | null => {
  if (typeof value === 'string') {
    switch (value) {
      case 'Normal':
      case 'Document':
        return value;
      default:
        return null;
    }
  }
  return null;
};

const weekdayOptions: { value: number; label: string }[] = [
  { value: 0, label: '日曜日' },
  { value: 1, label: '月曜日' },
  { value: 2, label: '火曜日' },
  { value: 3, label: '水曜日' },
  { value: 4, label: '木曜日' },
  { value: 5, label: '金曜日' },
  { value: 6, label: '土曜日' },
];

const generativeOptions: { value: OrganizationSettingResponse['generativeApiVendor']; label: string }[] = [
  { value: 'None', label: '未設定' },
  { value: 'OpenAi', label: 'OpenAI' },
  { value: 'Anthropic', label: 'Anthropic' },
  { value: 'GoogleGemini', label: 'Google Gemini' },
  { value: 'DeepSeek', label: 'DeepSeek' },
];

const planOptions: { value: OrganizationSettingResponse['plan']; label: string }[] = [
  { value: 'Free', label: 'Free' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Enterprise', label: 'Enterprise' },
];

const helpNotificationTargetOptions: { value: NonNullable<HelpNotificationTarget>; label: string }[] = [
  { value: 'Organization', label: '組織全体' },
  { value: 'WorkspaceUsers', label: 'ワークスペースユーザー' },
];

const groupChatScopeOptions: { value: 'Workspace' | 'Organization'; label: string }[] = [
  { value: 'Workspace', label: 'ワークスペース単位' },
  { value: 'Organization', label: '組織単位' },
];

const workspaceModeOptions: { value: 'Normal' | 'Document'; label: string }[] = [
  { value: 'Normal', label: '通常' },
  { value: 'Document', label: 'ドキュメント' },
];

const badgeVisibilityOptions: { value: 'Private' | 'Workspace' | 'Organization'; label: string }[] = [
  { value: 'Private', label: '非公開' },
  { value: 'Workspace', label: 'ワークスペース内で公開' },
  { value: 'Organization', label: '組織全体で公開' },
];

export default function AdminSettingsClient({ organization, fetchError }: AdminSettingsClientProps) {
  const notify = useNotify();
  const currentUser = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initialSetting = (organization.setting as OrganizationSettingResponse & {
    generativeApiKey?: string | null;
    generativeApiModel?: string | null;
  }) ?? {
    taskOverdueThreshold: 0,
    weeklyReportDeliveryDay: 0,
    mailFromAddress: '',
    mailFromName: '',
    generativeApiVendor: 'None' as OrganizationSettingResponse['generativeApiVendor'],
    plan: 'Free' as OrganizationSettingResponse['plan'],
    helpNotificationTarget: undefined as OrganizationSettingResponse['helpNotificationTarget'],
    generativeApiKey: '',
    generativeApiModel: '',
    requireEstimateOnTaskCreation: false,
    enforcePredecessorCompletion: false,
    dashboardHelpCommentMaxCount: 6,
    groupChatScope: null as OrganizationSettingResponse['groupChatScope'],
    defaultWorkspaceMode: null as OrganizationSettingResponse['defaultWorkspaceMode'],
    gamificationEnabled: true,
    gamificationBadgeVisibility: 'Private' as OrganizationSettingResponse['gamificationBadgeVisibility'],
    gamificationAllowUserOverride: true,
    botGroupChatMessagesEnabled: true,
    rowVersion: 0,
  };

  const [rowVersion, setRowVersion] = useState<number>(initialSetting.rowVersion ?? 0);
  const [availableModels, setAvailableModels] = useState<AvailableModelResponse[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // 競合状態管理
  const [isConflict, setIsConflict] = useState(false);
  const [conflictData, setConflictData] = useState<OrganizationSettingResponse | null>(null);

  const [formData, setFormData] = useState<OrganizationSettingInput>({
    taskOverdueThreshold: initialSetting.taskOverdueThreshold ?? 0,
    weeklyReportDeliveryDay: initialSetting.weeklyReportDeliveryDay ?? 0,
    mailFromAddress: initialSetting.mailFromAddress ?? '',
    mailFromName: initialSetting.mailFromName ?? '',
    generativeApiVendor: normalizeVendor(initialSetting.generativeApiVendor),
    plan: normalizePlan(initialSetting.plan),
    helpNotificationTarget: initialSetting.helpNotificationTarget ?? null,
    generativeApiKey: initialSetting.generativeApiKey ?? '',
    generativeApiModel: initialSetting.generativeApiModel ?? '',
    requireEstimateOnTaskCreation: initialSetting.requireEstimateOnTaskCreation ?? false,
    enforcePredecessorCompletion: initialSetting.enforcePredecessorCompletion ?? false,
    dashboardHelpCommentMaxCount: initialSetting.dashboardHelpCommentMaxCount ?? 6,
    groupChatScope: initialSetting.groupChatScope ?? null,
    defaultWorkspaceMode: normalizeWorkspaceMode(initialSetting.defaultWorkspaceMode),
    gamificationEnabled: initialSetting.gamificationEnabled ?? true,
    gamificationBadgeVisibility: initialSetting.gamificationBadgeVisibility ?? 'Private',
    gamificationAllowUserOverride: initialSetting.gamificationAllowUserOverride ?? true,
    botGroupChatMessagesEnabled: initialSetting.botGroupChatMessagesEnabled ?? true,
  });

  // モデル一覧を取得する関数
  const fetchAvailableModels = useCallback(
    async (vendor: OrganizationSettingResponse['generativeApiVendor'], apiKey: string, currentModel?: string) => {
      if (vendor === 'None' || !apiKey) {
        setAvailableModels([]);
        setModelError(null);
        return;
      }

      setIsLoadingModels(true);
      setModelError(null);

      try {
        const result = await getAvailableModels(vendor, apiKey);
        if (result.success && result.data) {
          if (result.data.success && result.data.models) {
            setAvailableModels(result.data.models);
            // 現在設定されているモデルが取得結果に含まれているかチェック
            if (currentModel && result.data.models.length > 0) {
              const modelExists = result.data.models.some((m) => m.id === currentModel);
              if (!modelExists) {
                setModelError(
                  `現在設定されているモデル「${currentModel}」は利用できません。別のモデルを選択してください。`,
                );
              } else {
                setModelError(null);
              }
            } else {
              setModelError(null);
            }
          } else {
            setAvailableModels([]);
            setModelError(result.data.errorMessage || 'モデル一覧の取得に失敗しました。');
          }
        } else if (!result.success) {
          setAvailableModels([]);
          setModelError(result.message || 'モデル一覧の取得に失敗しました。');
        }
      } catch (error) {
        console.error('Failed to fetch available models:', error);
        setAvailableModels([]);
        setModelError('モデル一覧の取得中にエラーが発生しました。');
      } finally {
        setIsLoadingModels(false);
      }
    },
    [],
  );

  // 初期ロード時にモデル一覧を取得
  useEffect(() => {
    if (initialSetting.generativeApiVendor !== 'None' && initialSetting.generativeApiKey) {
      fetchAvailableModels(
        normalizeVendor(initialSetting.generativeApiVendor),
        initialSetting.generativeApiKey,
        initialSetting.generativeApiModel ?? undefined,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: organizationSettingSchemaWithRules,
      onValidationError: (errors) => {
        const errorCount = Object.keys(errors).length;
        notify.error(`入力内容に${errorCount}件のエラーがあります。各フィールドを確認してください。`);
      },
      onSubmit: async (data) => {
        try {
          const result = await updateOrganizationSetting({
            taskOverdueThreshold: data.taskOverdueThreshold,
            weeklyReportDeliveryDay: data.weeklyReportDeliveryDay,
            mailFromAddress: data.mailFromAddress ? String(data.mailFromAddress) : null,
            mailFromName: data.mailFromName ? String(data.mailFromName) : null,
            generativeApiVendor: data.generativeApiVendor,
            plan: data.plan,
            helpNotificationTarget: data.helpNotificationTarget ?? undefined,
            generativeApiKey: data.generativeApiVendor === 'None' ? null : (data.generativeApiKey ?? null),
            generativeApiModel: data.generativeApiVendor === 'None' ? null : (data.generativeApiModel ?? null),
            requireEstimateOnTaskCreation: data.requireEstimateOnTaskCreation ?? false,
            enforcePredecessorCompletion: data.enforcePredecessorCompletion ?? false,
            dashboardHelpCommentMaxCount: data.dashboardHelpCommentMaxCount ?? 6,
            groupChatScope: data.groupChatScope ?? undefined,
            defaultWorkspaceMode: data.defaultWorkspaceMode ?? undefined,
            gamificationEnabled: data.gamificationEnabled ?? true,
            gamificationBadgeVisibility: data.gamificationBadgeVisibility ?? 'Private',
            gamificationAllowUserOverride: data.gamificationAllowUserOverride ?? true,
            botGroupChatMessagesEnabled: data.botGroupChatMessagesEnabled ?? true,
            rowVersion,
          });

          if (result.success) {
            syncWithResponse(result.data);
            notify.success('組織設定を更新しました。');
            return;
          }

          if (!result.success && result.error === 'conflict') {
            if ('latest' in result && result.latest) {
              const latest = result.latest.data as OrganizationSettingResponse;
              setConflictData(latest);
              setIsConflict(true);
            } else {
              // latest が取得できなかった場合は通常のエラー表示
              notify.error(result.message || '別のユーザーが同時に変更しました。ページを再読み込みしてください。');
            }
            return;
          }

          notify.error(result.message || '組織設定の更新に失敗しました。');
        } catch (error) {
          console.error('Failed to update organization setting:', error);
          notify.error('組織設定の更新中にエラーが発生しました。');
        }
      },
    });

  const syncWithResponse = (setting: OrganizationSettingResponse) => {
    setRowVersion(setting.rowVersion ?? 0);
    const extendedSetting = setting as OrganizationSettingResponse & {
      generativeApiKey?: string | null;
      generativeApiModel?: string | null;
    };
    setFormData({
      taskOverdueThreshold: setting.taskOverdueThreshold ?? 0,
      weeklyReportDeliveryDay: setting.weeklyReportDeliveryDay ?? 0,
      mailFromAddress: setting.mailFromAddress ?? '',
      mailFromName: setting.mailFromName ?? '',
      generativeApiVendor: normalizeVendor(setting.generativeApiVendor),
      plan: normalizePlan(setting.plan),
      helpNotificationTarget: setting.helpNotificationTarget ?? null,
      generativeApiKey: extendedSetting.generativeApiKey ?? '',
      generativeApiModel: extendedSetting.generativeApiModel ?? '',
      requireEstimateOnTaskCreation: setting.requireEstimateOnTaskCreation ?? false,
      enforcePredecessorCompletion: setting.enforcePredecessorCompletion ?? false,
      dashboardHelpCommentMaxCount: setting.dashboardHelpCommentMaxCount ?? 6,
      groupChatScope: setting.groupChatScope ?? null,
      defaultWorkspaceMode: normalizeWorkspaceMode(setting.defaultWorkspaceMode),
      gamificationEnabled: setting.gamificationEnabled ?? true,
      gamificationBadgeVisibility: setting.gamificationBadgeVisibility ?? 'Private',
      gamificationAllowUserOverride: setting.gamificationAllowUserOverride ?? true,
      botGroupChatMessagesEnabled: setting.botGroupChatMessagesEnabled ?? true,
    });
  };

  const handleFieldChange = async (fieldName: keyof OrganizationSettingInput, value: unknown) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [fieldName]: value as never,
      };

      if (fieldName === 'generativeApiVendor' && value === 'None') {
        next.generativeApiKey = '' as never;
        next.generativeApiModel = '' as never;
      }

      return next;
    });

    // ベンダーまたはAPIキーが変更されたらモデル一覧をクリア
    if (fieldName === 'generativeApiVendor') {
      setAvailableModels([]);
      setModelError(null);
      // モデルもクリア
      setFormData((prev) => ({ ...prev, generativeApiModel: '' }));
    }

    await validateField(fieldName, value);
  };

  // APIキーの入力が完了したらモデル一覧を取得
  const handleApiKeyBlur = () => {
    if (formData.generativeApiVendor !== 'None' && formData.generativeApiKey) {
      fetchAvailableModels(
        formData.generativeApiVendor,
        formData.generativeApiKey,
        formData.generativeApiModel || undefined,
      );
    }
  };

  const vendorRequiresKey = formData.generativeApiVendor !== 'None';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      <AdminHeader userInfo={currentUser} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={false} />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar sidebarOpen={sidebarOpen} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">組織設定</h1>
                <p className="text-base-content/60 mt-1">タスク期限や配信設定を更新します</p>
              </div>
            </div>

            {fetchError && (
              <div className="alert alert-soft alert-error">
                <span>{fetchError}</span>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="card">
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label" htmlFor="weeklyReportDeliveryDay">
                      <span className="label-text font-semibold">週間レポート配信曜日 </span>
                    </label>
                    <input
                      id="weeklyReportDeliveryDay"
                      name="weeklyReportDeliveryDay"
                      type="hidden"
                      value={formData.weeklyReportDeliveryDay}
                      readOnly
                      required
                    />
                    <div
                      className={`flex flex-wrap gap-2 ${shouldShowError('weeklyReportDeliveryDay') ? 'ring-2 ring-error rounded-lg p-2' : ''}`}
                    >
                      {weekdayOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFieldChange('weeklyReportDeliveryDay', option.value)}
                          className={`btn btn-sm ${
                            formData.weeklyReportDeliveryDay === option.value ? 'btn-primary' : 'btn-outline'
                          }`}
                          aria-label={`曜日選択: ${option.label}`}
                          disabled={isSubmitting}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {shouldShowError('weeklyReportDeliveryDay') && (
                      <span className="label-text-alt text-error mt-2">{getFieldError('weeklyReportDeliveryDay')}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label" htmlFor="input-mail-from-address">
                      <span className="label-text font-semibold">
                        メール配信元アドレス <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="input-mail-from-address"
                      name="mailFromAddress"
                      type="email"
                      className={`input input-bordered ${shouldShowError('mailFromAddress') ? 'input-error' : ''}`}
                      value={formData.mailFromAddress ?? ''}
                      onChange={(e) => handleFieldChange('mailFromAddress', e.target.value)}
                      placeholder="noreply@example.com"
                      required
                    />
                    {shouldShowError('mailFromAddress') && (
                      <span className="label-text-alt text-error">{getFieldError('mailFromAddress')}</span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="input-mail-from-name">
                      <span className="label-text font-semibold">
                        メール配信元名 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="input-mail-from-name"
                      name="mailFromName"
                      type="text"
                      className={`input input-bordered ${shouldShowError('mailFromName') ? 'input-error' : ''}`}
                      value={formData.mailFromName ?? ''}
                      onChange={(e) => handleFieldChange('mailFromName', e.target.value)}
                      placeholder="Pecus サポート"
                      required
                    />
                    {shouldShowError('mailFromName') && (
                      <span className="label-text-alt text-error">{getFieldError('mailFromName')}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label" htmlFor="select-generative-vendor">
                      <span className="label-text font-semibold">
                        生成APIベンダー <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      id="select-generative-vendor"
                      name="generativeApiVendor"
                      className={`select select-bordered ${shouldShowError('generativeApiVendor') ? 'select-error' : ''}`}
                      value={formData.generativeApiVendor}
                      onChange={(e) => handleFieldChange('generativeApiVendor', e.target.value)}
                      required
                    >
                      {generativeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {shouldShowError('generativeApiVendor') && (
                      <span className="label-text-alt text-error">{getFieldError('generativeApiVendor')}</span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="input-generative-api-key">
                      <span className="label-text font-semibold">
                        生成APIキー {vendorRequiresKey && <span className="text-error">*</span>}
                      </span>
                    </label>
                    <input
                      id="input-generative-api-key"
                      name="generativeApiKey"
                      type="password"
                      className={`input input-bordered ${shouldShowError('generativeApiKey') ? 'input-error' : ''}`}
                      value={formData.generativeApiKey ?? ''}
                      onChange={(e) => handleFieldChange('generativeApiKey', e.target.value)}
                      onBlur={handleApiKeyBlur}
                      placeholder=""
                      disabled={!vendorRequiresKey}
                    />
                    {shouldShowError('generativeApiKey') && (
                      <span className="label-text-alt text-error">{getFieldError('generativeApiKey')}</span>
                    )}
                    {!vendorRequiresKey && (
                      <span className="label-text-alt text-xs text-base-content/60">
                        ベンダーが未設定の場合、APIキーは保存されません。
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="select-generative-model">
                      <span className="label-text font-semibold">生成AIモデル</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="select-generative-model"
                        name="generativeApiModel"
                        className={`select select-bordered flex-1 ${shouldShowError('generativeApiModel') ? 'select-error' : ''}`}
                        value={formData.generativeApiModel ?? ''}
                        onChange={(e) => handleFieldChange('generativeApiModel', e.target.value)}
                        disabled={!vendorRequiresKey || isLoadingModels}
                      >
                        <option value="">{isLoadingModels ? '読み込み中...' : 'モデルを選択してください'}</option>
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-square btn-outline"
                        onClick={() => {
                          if (formData.generativeApiVendor !== 'None' && formData.generativeApiKey) {
                            fetchAvailableModels(
                              formData.generativeApiVendor,
                              formData.generativeApiKey,
                              formData.generativeApiModel || undefined,
                            );
                          }
                        }}
                        disabled={!vendorRequiresKey || !formData.generativeApiKey || isLoadingModels}
                        title="モデル一覧を再取得"
                      >
                        <span
                          className={`icon-[mdi--refresh] size-5 ${isLoadingModels ? 'animate-spin' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    {shouldShowError('generativeApiModel') && (
                      <span className="label-text-alt text-error">{getFieldError('generativeApiModel')}</span>
                    )}
                    {modelError && <span className="label-text-alt text-error">{modelError}</span>}
                    {!vendorRequiresKey && (
                      <span className="label-text-alt text-xs text-base-content/60">
                        ベンダーを選択しAPIキーを入力後、モデルを選択できます。
                      </span>
                    )}
                    {vendorRequiresKey && !formData.generativeApiKey && (
                      <span className="label-text-alt text-xs text-base-content/60">APIキーを入力してください。</span>
                    )}
                    {vendorRequiresKey &&
                      formData.generativeApiKey &&
                      availableModels.length === 0 &&
                      !isLoadingModels &&
                      !modelError && (
                        <span className="label-text-alt text-xs text-base-content/60">
                          APIキー入力後、フォーカスを外すとモデル一覧を取得します。
                        </span>
                      )}
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="select-plan">
                      <span className="label-text font-semibold">
                        プラン <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      id="select-plan"
                      name="plan"
                      className={`select select-bordered ${shouldShowError('plan') ? 'select-error' : ''}`}
                      value={formData.plan}
                      onChange={(e) => handleFieldChange('plan', e.target.value)}
                      required
                    >
                      {planOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {shouldShowError('plan') && (
                      <span className="label-text-alt text-error">{getFieldError('plan')}</span>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-semibold mt-8 pb-2 border-b border-base-content/20">タスクの設定</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label" htmlFor="input-task-overdue">
                        <span className="label-text font-semibold">
                          タスク超過閾値（日） <span className="text-error">*</span>
                        </span>
                      </label>
                      <div
                        className={`input input-bordered flex items-center ${shouldShowError('taskOverdueThreshold') ? 'input-error' : ''}`}
                      >
                        <input
                          id="input-task-overdue"
                          name="taskOverdueThreshold"
                          type="text"
                          inputMode="numeric"
                          value={formData.taskOverdueThreshold}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              handleFieldChange('taskOverdueThreshold', 0);
                            } else {
                              const num = parseInt(val, 10);
                              if (!Number.isNaN(num) && num >= 0 && num <= 365) {
                                handleFieldChange('taskOverdueThreshold', num);
                              }
                            }
                          }}
                          className="flex-1 bg-transparent outline-none min-w-0"
                          placeholder="0"
                          disabled={isSubmitting}
                          aria-label="タスク超過閾値入力"
                        />
                        <span className="my-auto flex gap-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                            aria-label="1日減らす"
                            onClick={() =>
                              handleFieldChange('taskOverdueThreshold', Math.max(0, formData.taskOverdueThreshold - 1))
                            }
                            disabled={isSubmitting || formData.taskOverdueThreshold <= 0}
                          >
                            <span className="icon-[mdi--minus-circle-outline] size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                            aria-label="1日増やす"
                            onClick={() =>
                              handleFieldChange(
                                'taskOverdueThreshold',
                                Math.min(365, formData.taskOverdueThreshold + 1),
                              )
                            }
                            disabled={isSubmitting || formData.taskOverdueThreshold >= 365}
                          >
                            <span className="icon-[mdi--plus-circle-outline] size-4" aria-hidden="true" />
                          </button>
                        </span>
                      </div>
                      {shouldShowError('taskOverdueThreshold') && (
                        <span className="label-text-alt text-error">{getFieldError('taskOverdueThreshold')}</span>
                      )}
                      <span className="label-text-alt text-xs text-base-content/60 mt-1">
                        タスクの期限を超過した際に警告表示するまでの猶予日数を設定します。
                      </span>
                    </div>

                    <div className="form-control">
                      <label className="label" htmlFor="select-help-notification-target">
                        <span className="label-text font-semibold">ヘルプコメント通知先</span>
                      </label>
                      <select
                        id="select-help-notification-target"
                        name="helpNotificationTarget"
                        className={`select select-bordered ${shouldShowError('helpNotificationTarget') ? 'select-error' : ''}`}
                        value={formData.helpNotificationTarget ?? ''}
                        onChange={(e) => handleFieldChange('helpNotificationTarget', e.target.value)}
                      >
                        {helpNotificationTargetOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {shouldShowError('helpNotificationTarget') && (
                        <span className="label-text-alt text-error">{getFieldError('helpNotificationTarget')}</span>
                      )}
                      <span className="label-text-alt text-xs text-base-content/60 mt-1">
                        担当者からのヘルプコメントを誰に通知するかを設定します。
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer" htmlFor="toggle-require-estimate">
                        <input
                          id="toggle-require-estimate"
                          name="requireEstimateOnTaskCreation"
                          type="checkbox"
                          className="switch switch-primary"
                          checked={formData.requireEstimateOnTaskCreation ?? false}
                          onChange={(e) => handleFieldChange('requireEstimateOnTaskCreation', e.target.checked)}
                          disabled={isSubmitting}
                        />
                        <span className="font-semibold">タスク作成時に見積もりを必須とする</span>
                      </label>
                      <p className="text-sm text-base-content/60 pl-12">
                        有効にすると、タスク作成時に見積もり時間の入力が必須になります。
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer" htmlFor="toggle-enforce-predecessor">
                        <input
                          id="toggle-enforce-predecessor"
                          name="enforcePredecessorCompletion"
                          type="checkbox"
                          className="switch switch-primary"
                          checked={formData.enforcePredecessorCompletion ?? false}
                          onChange={(e) => handleFieldChange('enforcePredecessorCompletion', e.target.checked)}
                          disabled={isSubmitting}
                        />
                        <span className="font-semibold">先行タスク完了を強制する</span>
                      </label>
                      <p className="text-sm text-base-content/60 pl-12">
                        有効にすると、先行タスクが完了するまで後続タスクを操作できなくなります。
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-lg font-semibold mt-8 pb-2 border-b border-base-content/20">ダッシュボード設定</h2>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <Slider
                      min={5}
                      max={20}
                      step={1}
                      name="dashboardHelpCommentMaxCount"
                      value={formData.dashboardHelpCommentMaxCount ?? 6}
                      onChange={(value) => handleFieldChange('dashboardHelpCommentMaxCount', value)}
                      label="ヘルプコメント表示件数"
                      showValue
                      valueFormatter={(v) => `${v}件`}
                      disabled={isSubmitting}
                      ariaLabel="ダッシュボードに表示するヘルプコメントの最大件数"
                    />
                    <p className="text-sm text-base-content/60">
                      ダッシュボードに表示する「ヘルプを求めているタスク」の最大件数を設定します。
                    </p>
                    {shouldShowError('dashboardHelpCommentMaxCount') && (
                      <p className="text-sm text-error">{getFieldError('dashboardHelpCommentMaxCount')}</p>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-semibold mt-8 pb-2 border-b border-base-content/20">チャット設定</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label" htmlFor="select-group-chat-scope">
                        <span className="label-text font-semibold">グループチャットのスコープ</span>
                      </label>
                      <select
                        id="select-group-chat-scope"
                        name="groupChatScope"
                        className={`select select-bordered ${shouldShowError('groupChatScope') ? 'select-error' : ''}`}
                        value={formData.groupChatScope ?? 'Workspace'}
                        onChange={(e) =>
                          handleFieldChange('groupChatScope', e.target.value as 'Workspace' | 'Organization')
                        }
                        disabled={isSubmitting}
                      >
                        {groupChatScopeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {shouldShowError('groupChatScope') && (
                        <span className="label-text-alt text-error">{getFieldError('groupChatScope')}</span>
                      )}
                      <span className="label-text-alt text-xs text-base-content/60 mt-1">
                        グループチャットをワークスペースごとに作成するか、組織全体で1つのチャットルームを共有するかを設定します。
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer" htmlFor="toggle-bot-group-chat-messages">
                      <input
                        id="toggle-bot-group-chat-messages"
                        name="botGroupChatMessagesEnabled"
                        type="checkbox"
                        className="switch switch-primary"
                        checked={formData.botGroupChatMessagesEnabled ?? true}
                        onChange={(e) => handleFieldChange('botGroupChatMessagesEnabled', e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <span className="font-semibold">Botがグループチャットにメッセージを送信する</span>
                    </label>
                    <p className="text-sm text-base-content/60 pl-12">
                      無効にすると、Botはグループチャットにメッセージを送信しなくなります。
                    </p>
                  </div>
                </div>

                <h2 className="text-lg font-semibold mt-8 pb-2 border-b border-base-content/20">ワークスペース設定</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label" htmlFor="select-default-workspace-mode">
                        <span className="label-text font-semibold">デフォルトのワークスペースモード</span>
                      </label>
                      <select
                        id="select-default-workspace-mode"
                        name="defaultWorkspaceMode"
                        className={`select select-bordered ${shouldShowError('defaultWorkspaceMode') ? 'select-error' : ''}`}
                        value={formData.defaultWorkspaceMode ?? 'Normal'}
                        onChange={(e) =>
                          handleFieldChange('defaultWorkspaceMode', e.target.value as 'Normal' | 'Document')
                        }
                        disabled={isSubmitting}
                      >
                        {workspaceModeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {shouldShowError('defaultWorkspaceMode') && (
                        <span className="label-text-alt text-error">{getFieldError('defaultWorkspaceMode')}</span>
                      )}
                      <span className="label-text-alt text-xs text-base-content/60 mt-1">
                        新しいワークスペースを作成する際のデフォルトモードを設定します。通常モードはすべての機能が利用可能、ドキュメントモードはドキュメント中心のシンプルな構成になります。
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="text-lg font-semibold mt-8 pb-2 border-b border-base-content/20">
                  ゲーミフィケーション設定
                </h2>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer" htmlFor="gamificationEnabled">
                      <input
                        type="checkbox"
                        id="gamificationEnabled"
                        name="gamificationEnabled"
                        className="switch switch-primary"
                        checked={formData.gamificationEnabled ?? true}
                        onChange={(e) => handleFieldChange('gamificationEnabled', e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <span className="font-semibold">ゲーミフィケーション機能を有効にする</span>
                    </label>
                    <p className="text-sm text-base-content/60 pl-12">
                      バッジやアチーブメントなどのゲーミフィケーション機能を使用できるようにします。
                    </p>
                  </div>

                  {formData.gamificationEnabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                          <label className="label" htmlFor="select-badge-visibility">
                            <span className="label-text font-semibold">デフォルトのバッジ公開範囲</span>
                          </label>
                          <select
                            id="select-badge-visibility"
                            name="gamificationBadgeVisibility"
                            className={`select select-bordered ${shouldShowError('gamificationBadgeVisibility') ? 'select-error' : ''}`}
                            value={formData.gamificationBadgeVisibility ?? 'Private'}
                            onChange={(e) =>
                              handleFieldChange(
                                'gamificationBadgeVisibility',
                                e.target.value as 'Private' | 'Workspace' | 'Organization',
                              )
                            }
                            disabled={isSubmitting}
                          >
                            {badgeVisibilityOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {shouldShowError('gamificationBadgeVisibility') && (
                            <span className="label-text-alt text-error">
                              {getFieldError('gamificationBadgeVisibility')}
                            </span>
                          )}
                          <span className="label-text-alt text-xs text-base-content/60 mt-1">
                            ユーザーが取得したバッジを他のユーザーに公開する範囲を設定します。
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          className="flex items-center gap-3 cursor-pointer"
                          htmlFor="gamificationAllowUserOverride"
                        >
                          <input
                            type="checkbox"
                            id="gamificationAllowUserOverride"
                            name="gamificationAllowUserOverride"
                            className="switch switch-primary"
                            checked={formData.gamificationAllowUserOverride ?? true}
                            onChange={(e) => handleFieldChange('gamificationAllowUserOverride', e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <span className="font-semibold">ユーザーによる公開範囲の変更を許可する</span>
                        </label>
                        <p className="text-sm text-base-content/60 pl-12">
                          各ユーザーが自分のバッジ公開範囲を個別に設定できるようにします。
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* 競合アラート */}
                <ConflictAlert
                  isConflict={isConflict}
                  latestData={conflictData}
                  onOverwrite={async (latestRowVersion) => {
                    // 最新の rowVersion で直接 API を呼び出す
                    setIsConflict(false);
                    setConflictData(null);

                    try {
                      const result = await updateOrganizationSetting({
                        taskOverdueThreshold: formData.taskOverdueThreshold,
                        weeklyReportDeliveryDay: formData.weeklyReportDeliveryDay,
                        mailFromAddress: formData.mailFromAddress ? String(formData.mailFromAddress) : null,
                        mailFromName: formData.mailFromName ? String(formData.mailFromName) : null,
                        generativeApiVendor: formData.generativeApiVendor,
                        plan: formData.plan,
                        helpNotificationTarget: formData.helpNotificationTarget ?? undefined,
                        generativeApiKey:
                          formData.generativeApiVendor === 'None' ? null : (formData.generativeApiKey ?? null),
                        generativeApiModel:
                          formData.generativeApiVendor === 'None' ? null : (formData.generativeApiModel ?? null),
                        requireEstimateOnTaskCreation: formData.requireEstimateOnTaskCreation ?? false,
                        enforcePredecessorCompletion: formData.enforcePredecessorCompletion ?? false,
                        dashboardHelpCommentMaxCount: formData.dashboardHelpCommentMaxCount ?? 6,
                        groupChatScope: formData.groupChatScope ?? undefined,
                        defaultWorkspaceMode: formData.defaultWorkspaceMode ?? undefined,
                        gamificationEnabled: formData.gamificationEnabled ?? true,
                        gamificationBadgeVisibility: formData.gamificationBadgeVisibility ?? 'Private',
                        gamificationAllowUserOverride: formData.gamificationAllowUserOverride ?? true,
                        botGroupChatMessagesEnabled: formData.botGroupChatMessagesEnabled ?? true,
                        rowVersion: latestRowVersion,
                      });

                      if (result.success) {
                        syncWithResponse(result.data);
                        notify.success('組織設定を更新しました。');
                      } else if (
                        !result.success &&
                        result.error === 'conflict' &&
                        'latest' in result &&
                        result.latest
                      ) {
                        const latest = result.latest.data as OrganizationSettingResponse;
                        setConflictData(latest);
                        setIsConflict(true);
                      } else {
                        notify.error(result.message || '組織設定の更新に失敗しました。');
                      }
                    } catch (error) {
                      console.error('Failed to update organization setting:', error);
                      notify.error('組織設定の更新中にエラーが発生しました。');
                    }
                  }}
                  onDiscard={(latestData) => {
                    // サーバーの最新データでフォームを更新（resetForm は不要）
                    syncWithResponse(latestData);
                    setIsConflict(false);
                    setConflictData(null);
                  }}
                  isProcessing={isSubmitting}
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      resetForm();
                      syncWithResponse(initialSetting);
                    }}
                    disabled={isSubmitting}
                  >
                    リセット
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || isConflict}>
                    {isSubmitting ? '更新中...' : '保存'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
