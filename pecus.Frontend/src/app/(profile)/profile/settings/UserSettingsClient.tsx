'use client';

import { useState } from 'react';
import { updateUserSetting } from '@/actions/profile';
import { ConflictAlert } from '@/components/common/feedback/ConflictAlert';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import { Slider } from '@/components/common/filters/Slider';
import type {
  BadgeVisibility,
  EmailNotificationMode,
  FocusScorePriority,
  LandingPage,
  OrganizationPublicSettings,
  UserSettingResponse,
  WorkspaceListItemResponse,
} from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import {
  type EmailNotificationCustomSettingsInput,
  type UserSettingInput,
  userSettingSchema,
} from '@/schemas/userSettingSchemas';
import { LANDING_PAGE_OPTIONS } from '@/utils/landingPage';

interface UserSettingsClientProps {
  initialSettings: UserSettingResponse;
  organizationSetting: OrganizationPublicSettings | null;
  workspaces?: WorkspaceListItemResponse[];
  fetchError?: string | null;
}

const FOCUS_SCORE_PRIORITY_OPTIONS: { value: NonNullable<FocusScorePriority>; label: string; description: string }[] = [
  { value: 'Priority', label: '優先度重視', description: 'タスクの優先度を最も重視してスコアリングします' },
  { value: 'Deadline', label: '期限重視', description: 'タスクの期限を最も重視してスコアリングします' },
  {
    value: 'SuccessorImpact',
    label: '後続タスク影響重視',
    description: '後続タスクへの影響を最も重視してスコアリングします',
  },
];

const BADGE_VISIBILITY_OPTIONS: { value: NonNullable<BadgeVisibility>; label: string }[] = [
  { value: 'Private', label: '非公開' },
  { value: 'Workspace', label: 'ワークスペース内で公開' },
  { value: 'Organization', label: '組織全体で公開' },
];

const EMAIL_NOTIFICATION_MODE_OPTIONS: {
  value: NonNullable<EmailNotificationMode>;
  label: string;
  badge?: string;
  description: string;
}[] = [
  {
    value: 'ImportantOnly',
    label: '重要通知のみ',
    description: '自分宛てのメンション・依頼・督促、期限超過、アジェンダ中止/リマインダーに絞り込みます',
  },
  {
    value: 'Standard',
    label: '標準',
    badge: '推奨',
    description: 'Coati推奨のデフォルト設定（担当タスク、PINアイテム、アジェンダ通知を含む）',
  },
  {
    value: 'Custom',
    label: 'カスタム',
    description: '通知項目ごとに個別のON/OFFを自由に設定します',
  },
];

const CUSTOM_SETTING_SECTIONS: {
  category: string;
  icon: string;
  items: {
    key: keyof EmailNotificationCustomSettingsInput;
    label: string;
    description: string;
  }[];
}[] = [
  {
    category: '自分宛ての通知',
    icon: 'icon-[mdi--account-alert]',
    items: [
      { key: 'directMention', label: '自分へのメンション', description: 'コメント等で自分がメンションされたとき' },
      { key: 'directNeedReply', label: '返信依頼（NeedReply）', description: 'コメントで返信を求められたとき' },
      { key: 'directUrge', label: '督促（Urge / Reminder）', description: 'タスクの進捗督促コメントが届いたとき' },
      {
        key: 'directHelpWanted',
        label: 'ヘルプ要請（HelpWanted）',
        description: 'ヘルプを求めるコメントが投稿されたとき',
      },
    ],
  },
  {
    category: 'タスク通知',
    icon: 'icon-[mdi--checkbox-marked-circle-outline]',
    items: [
      {
        key: 'taskAssignedCreated',
        label: '自分が担当するタスクの作成',
        description: '自分が担当者に割り当てられたタスクが作成されたとき',
      },
      {
        key: 'taskRelatedCompleted',
        label: '自分が関係するタスクの完了',
        description: '自分が関係するタスクが完了・破棄されたとき',
      },
      {
        key: 'taskOverdue',
        label: '担当タスクの期限超過',
        description: '自分が担当するタスクが期限を過ぎたとき',
      },
    ],
  },
  {
    category: 'アイテム・PIN通知',
    icon: 'icon-[mdi--pin-outline]',
    items: [
      {
        key: 'pinnedItemActivity',
        label: 'PIN留めアイテムの更新・タスク追加',
        description: 'PIN留めしたアイテムの更新や配下タスクが追加されたとき',
      },
      {
        key: 'assignedItemUpdated',
        label: '担当・コミット対象アイテムの更新',
        description: '自分が担当またはコミッターのアイテムが更新されたとき',
      },
      { key: 'itemBodyUpdated', label: 'アイテム本文の更新', description: 'アイテム本文の内容が更新されたとき' },
    ],
  },
  {
    category: 'コメント通知',
    icon: 'icon-[mdi--comment-text-outline]',
    items: [
      {
        key: 'generalComment',
        label: '一般コメントの追加',
        description: '関係するタスクに通常のコメントが投稿されたとき',
      },
    ],
  },
  {
    category: 'アジェンダ通知',
    icon: 'icon-[mdi--calendar-clock]',
    items: [
      {
        key: 'agendaInvitationOrUpdate',
        label: 'アジェンダへの招待・変更',
        description: 'アジェンダに招待された、または日時等が変更されたとき',
      },
      {
        key: 'agendaCancellationOrReminder',
        label: 'アジェンダの中止・リマインダー',
        description: 'アジェンダが中止された、または開始前リマインダーのとき',
      },
    ],
  },
  {
    category: 'ワークスペース活動',
    icon: 'icon-[mdi--folder-outline]',
    items: [
      {
        key: 'workspaceActivity',
        label: 'ワークスペース全体の活動・メンバー変更',
        description: 'ワークスペースの作成・更新・削除やメンバー変更があったとき',
      },
    ],
  },
];

const DEFAULT_CUSTOM_SETTINGS: EmailNotificationCustomSettingsInput = {
  directMention: true,
  directNeedReply: true,
  directUrge: true,
  directHelpWanted: true,
  taskAssignedCreated: true,
  taskRelatedCompleted: true,
  taskOverdue: true,
  pinnedItemActivity: true,
  assignedItemUpdated: false,
  itemBodyUpdated: false,
  generalComment: false,
  agendaInvitationOrUpdate: true,
  agendaCancellationOrReminder: true,
  workspaceActivity: false,
};

export default function UserSettingsClient({
  initialSettings,
  organizationSetting,
  workspaces = [],
  fetchError,
}: UserSettingsClientProps) {
  const notify = useNotify();
  const [rowVersion, setRowVersion] = useState<number>(initialSettings.rowVersion ?? 0);

  const initialCustomSettings: EmailNotificationCustomSettingsInput = {
    ...DEFAULT_CUSTOM_SETTINGS,
    ...(initialSettings.customEmailSettings ?? {}),
  };

  const [formData, setFormData] = useState<UserSettingInput>({
    canReceiveEmail: initialSettings.canReceiveEmail ?? true,
    emailNotificationMode:
      initialSettings.emailNotificationMode === 'Off' || !initialSettings.emailNotificationMode
        ? 'Standard'
        : initialSettings.emailNotificationMode,
    customEmailSettings: initialCustomSettings,
    emailWorkspaceIds: initialSettings.emailWorkspaceIds ?? null,
    canReceiveWeeklyReport: initialSettings.canReceiveWeeklyReport ?? false,
    canReceiveRealtimeNotification: initialSettings.canReceiveRealtimeNotification ?? true,
    timeZone: initialSettings.timeZone,
    language: initialSettings.language,
    landingPage: initialSettings.landingPage ?? undefined,
    focusScorePriority: initialSettings.focusScorePriority ?? undefined,
    focusTasksLimit: initialSettings.focusTasksLimit ?? 10,
    waitingTasksLimit: initialSettings.waitingTasksLimit ?? 10,
    badgeVisibility: initialSettings.badgeVisibility ?? undefined,
  });

  // ワークスペースフィルタのUI状態（'all' | 'custom'）
  const [workspaceFilterType, setWorkspaceFilterType] = useState<'all' | 'custom'>(
    initialSettings.emailWorkspaceIds && initialSettings.emailWorkspaceIds.length > 0 ? 'custom' : 'all',
  );

  // ゲーミフィケーション設定
  const gamificationEnabled = organizationSetting?.gamificationEnabled ?? false;
  const allowUserOverride = organizationSetting?.gamificationAllowUserOverride ?? false;
  const showBadgeVisibilitySetting = gamificationEnabled && allowUserOverride;

  // 競合状態管理
  const [isConflict, setIsConflict] = useState(false);
  const [conflictData, setConflictData] = useState<UserSettingResponse | null>(null);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: userSettingSchema,
      onSubmit: async (_data) => {
        try {
          const result = await updateUserSetting({
            canReceiveEmail: formData.canReceiveEmail,
            emailNotificationMode: formData.emailNotificationMode,
            customEmailSettings: formData.customEmailSettings,
            emailWorkspaceIds: formData.emailWorkspaceIds,
            canReceiveWeeklyReport: formData.canReceiveWeeklyReport,
            canReceiveRealtimeNotification: formData.canReceiveRealtimeNotification,
            timeZone: formData.timeZone,
            language: formData.language,
            landingPage: formData.landingPage as LandingPage | undefined,
            focusScorePriority: formData.focusScorePriority as FocusScorePriority | undefined,
            focusTasksLimit: formData.focusTasksLimit,
            waitingTasksLimit: formData.waitingTasksLimit,
            badgeVisibility: formData.badgeVisibility as BadgeVisibility | undefined,
            rowVersion,
          });

          if (result.success) {
            syncWithResponse(result.data);
            notify.success('設定を保存しました');
            return;
          }

          if (!result.success && result.error === 'conflict' && 'latest' in result && result.latest) {
            const latest = result.latest.data as UserSettingResponse;
            setConflictData(latest);
            setIsConflict(true);
            return;
          }

          notify.error(result.message || '保存に失敗しました');
        } catch (error) {
          console.error('Settings update error:', error);
          notify.error('予期しないエラーが発生しました');
        }
      },
    });

  const syncWithResponse = (setting: UserSettingResponse) => {
    setRowVersion(setting.rowVersion ?? 0);
    const updatedCustomSettings: EmailNotificationCustomSettingsInput = {
      ...DEFAULT_CUSTOM_SETTINGS,
      ...(setting.customEmailSettings ?? {}),
    };

    setFormData({
      canReceiveEmail: setting.canReceiveEmail ?? true,
      emailNotificationMode:
        setting.emailNotificationMode === 'Off' || !setting.emailNotificationMode
          ? 'Standard'
          : setting.emailNotificationMode,
      customEmailSettings: updatedCustomSettings,
      emailWorkspaceIds: setting.emailWorkspaceIds ?? null,
      canReceiveWeeklyReport: setting.canReceiveWeeklyReport ?? false,
      canReceiveRealtimeNotification: setting.canReceiveRealtimeNotification ?? true,
      timeZone: setting.timeZone,
      language: setting.language,
      landingPage: setting.landingPage ?? undefined,
      focusScorePriority: setting.focusScorePriority ?? undefined,
      focusTasksLimit: setting.focusTasksLimit ?? 10,
      waitingTasksLimit: setting.waitingTasksLimit ?? 10,
      badgeVisibility: setting.badgeVisibility ?? undefined,
    });
    setWorkspaceFilterType(setting.emailWorkspaceIds && setting.emailWorkspaceIds.length > 0 ? 'custom' : 'all');
  };

  const handleFieldChange = async (fieldName: keyof UserSettingInput, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value as never,
    }));
    await validateField(fieldName, value);
  };

  const handleCustomSettingChange = (key: keyof EmailNotificationCustomSettingsInput, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      customEmailSettings: {
        ...prev.customEmailSettings,
        [key]: value,
      },
    }));
  };

  const handleWorkspaceFilterTypeChange = (type: 'all' | 'custom') => {
    setWorkspaceFilterType(type);
    if (type === 'all') {
      handleFieldChange('emailWorkspaceIds', null);
    } else {
      // 全ワークスペースIDをデフォルト選択
      handleFieldChange(
        'emailWorkspaceIds',
        workspaces.map((w) => w.id),
      );
    }
  };

  const handleWorkspaceToggle = (workspaceId: number) => {
    const currentIds = formData.emailWorkspaceIds ?? workspaces.map((w) => w.id);
    const newIds = currentIds.includes(workspaceId)
      ? currentIds.filter((id) => id !== workspaceId)
      : [...currentIds, workspaceId];
    handleFieldChange('emailWorkspaceIds', newIds);
  };

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} message="保存中..." />
      <div className="max-w-4xl mx-auto">
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

        <div className="card bg-base-100">
          <div className="card-body">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* ======================================================== */}
              {/* メール通知設定セクション                                */}
              {/* ======================================================== */}
              <div>
                <h2 className="text-lg font-semibold mb-2">メール通知設定</h2>
                <div className="space-y-4">
                  {/* マスタースイッチ */}
                  <div className="form-control">
                    <label htmlFor="canReceiveEmail" className="flex items-center gap-3 cursor-pointer">
                      <input
                        id="canReceiveEmail"
                        name="canReceiveEmail"
                        type="checkbox"
                        className="switch switch-outline switch-primary"
                        checked={!!formData.canReceiveEmail}
                        onChange={(e) => handleFieldChange('canReceiveEmail', e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <span className="label-text font-semibold">メール通知を受信する</span>
                    </label>
                    <p className="text-sm text-base-content/70 ml-10">
                      OFFにすると、アカウント・セキュリティに関するシステムメールを除くすべてのメール配信を停止します
                    </p>
                  </div>

                  {/* マスターON時のみ展開 */}
                  {formData.canReceiveEmail && (
                    <div className="pl-4 sm:pl-8 border-l-2 border-base-300 space-y-6 pt-2">
                      {/* 配信モード選択 */}
                      <fieldset className="form-control">
                        <legend className="label pb-2">
                          <span className="label-text font-semibold">配信モード</span>
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {EMAIL_NOTIFICATION_MODE_OPTIONS.map((option) => {
                            const isSelected = (formData.emailNotificationMode ?? 'Standard') === option.value;
                            return (
                              <label
                                key={option.value}
                                className={`flex items-start gap-3 p-4 rounded-box border cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-base-300 bg-base-100 hover:bg-base-200/50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="emailNotificationMode"
                                  className="radio radio-primary mt-0.5"
                                  value={option.value}
                                  checked={isSelected}
                                  onChange={() => handleFieldChange('emailNotificationMode', option.value)}
                                  disabled={isSubmitting}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{option.label}</span>
                                    {option.badge && (
                                      <span className="badge badge-primary badge-xs">{option.badge}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-base-content/70 mt-1">{option.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>

                      {/* カスタム設定展開エリア */}
                      {formData.emailNotificationMode === 'Custom' && (
                        <div className="bg-base-200/40 p-4 sm:p-6 rounded-box border border-base-300 space-y-6">
                          <div>
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <span className="icon-[mdi--tune] size-4 text-primary" aria-hidden="true" />
                              <span>カスタム通知項目の個別設定</span>
                            </h3>
                            <p className="text-xs text-base-content/70 mt-0.5">
                              受信したい事象をそれぞれ選択してください（すべて即時配信）
                            </p>
                          </div>

                          <div className="space-y-6">
                            {CUSTOM_SETTING_SECTIONS.map((section) => (
                              <div key={section.category} className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                                  <span className={`${section.icon} size-4`} aria-hidden="true" />
                                  <span>{section.category}</span>
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5 bg-base-100 p-3 sm:p-4 rounded-box border border-base-300/80">
                                  {section.items.map((item) => {
                                    const checked = !!formData.customEmailSettings?.[item.key];
                                    return (
                                      <label
                                        key={item.key}
                                        htmlFor={`custom-${item.key}`}
                                        className="flex items-start justify-between gap-4 cursor-pointer py-1"
                                      >
                                        <div className="flex-1">
                                          <span className="text-sm font-medium">{item.label}</span>
                                          <p className="text-xs text-base-content/70">{item.description}</p>
                                        </div>
                                        <input
                                          id={`custom-${item.key}`}
                                          type="checkbox"
                                          className="switch switch-outline switch-primary shrink-0 mt-0.5"
                                          checked={checked}
                                          onChange={(e) => handleCustomSettingChange(item.key, e.target.checked)}
                                          disabled={isSubmitting}
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 週間レポート設定（独立） */}
                      <div className="form-control bg-base-200/20 p-4 rounded-box border border-base-300/60">
                        <label htmlFor="canReceiveWeeklyReport" className="flex items-start gap-3 cursor-pointer">
                          <input
                            id="canReceiveWeeklyReport"
                            name="canReceiveWeeklyReport"
                            type="checkbox"
                            className="switch switch-outline switch-primary mt-0.5"
                            checked={!!formData.canReceiveWeeklyReport}
                            onChange={(e) => handleFieldChange('canReceiveWeeklyReport', e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <div className="flex-1">
                            <span className="label-text font-semibold">週間レポートを受信する</span>
                            <p className="text-xs text-base-content/70 mt-0.5">
                              前週のタスク進捗やワークスペースの活動状況をまとめたサマリーメールを週1回受信します
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* 対象ワークスペース選択 */}
                      <fieldset className="form-control space-y-2">
                        <legend className="label pb-1">
                          <span className="label-text font-semibold">対象ワークスペース</span>
                        </legend>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="workspaceFilterType"
                              className="radio radio-primary radio-sm"
                              checked={workspaceFilterType === 'all'}
                              onChange={() => handleWorkspaceFilterTypeChange('all')}
                              disabled={isSubmitting}
                            />
                            <span>すべてのワークスペース</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="workspaceFilterType"
                              className="radio radio-primary radio-sm"
                              checked={workspaceFilterType === 'custom'}
                              onChange={() => handleWorkspaceFilterTypeChange('custom')}
                              disabled={isSubmitting}
                            />
                            <span>選択したワークスペースのみ</span>
                          </label>
                        </div>

                        {workspaceFilterType === 'custom' && (
                          <div className="mt-3 p-3 bg-base-100 rounded-box border border-base-300 space-y-2 max-h-48 overflow-y-auto">
                            {workspaces.length === 0 ? (
                              <p className="text-xs text-base-content/60 py-2 text-center">
                                所属しているワークスペースがありません
                              </p>
                            ) : (
                              workspaces.map((ws) => {
                                const isSelected = (formData.emailWorkspaceIds ?? []).includes(ws.id);
                                return (
                                  <label
                                    key={ws.id}
                                    className="flex items-center gap-2.5 p-1.5 hover:bg-base-200/50 rounded cursor-pointer text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-primary checkbox-xs"
                                      checked={isSelected}
                                      onChange={() => handleWorkspaceToggle(ws.id)}
                                      disabled={isSubmitting}
                                    />
                                    <span className="font-medium truncate">{ws.name}</span>
                                    {ws.code && (
                                      <span className="text-xs text-base-content/50 font-mono">({ws.code})</span>
                                    )}
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                        <p className="text-xs text-base-content/60">
                          ※ アジェンダ通知およびシステムメールは組織共通のため、ワークスペース選択に関係なく送信されます
                        </p>
                      </fieldset>
                    </div>
                  )}
                </div>
              </div>

              <div className="divider my-6" />

              {/* ======================================================== */}
              {/* 一般設定（ランディングページ、リアルタイム通知）         */}
              {/* ======================================================== */}
              <div className="form-control">
                <label htmlFor="canReceiveRealtimeNotification" className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="canReceiveRealtimeNotification"
                    name="canReceiveRealtimeNotification"
                    type="checkbox"
                    className="switch switch-outline switch-primary"
                    checked={!!formData.canReceiveRealtimeNotification}
                    onChange={(e) => handleFieldChange('canReceiveRealtimeNotification', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="label-text font-semibold">リアルタイム通知を受信する</span>
                </label>
                <p className="text-sm text-base-content/70 ml-10">画面上のトースト通知や更新通知を即座に受信します</p>
              </div>

              <div className="form-control">
                <label htmlFor="landingPage" className="label">
                  <span className="label-text font-semibold">ログイン後の表示ページ</span>
                </label>
                <select
                  id="landingPage"
                  name="landingPage"
                  className={`select select-bordered w-full ${shouldShowError('landingPage') ? 'select-error' : ''}`}
                  value={formData.landingPage ?? 'Dashboard'}
                  onChange={(e) => handleFieldChange('landingPage', e.target.value)}
                  disabled={isSubmitting}
                >
                  {LANDING_PAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {shouldShowError('landingPage') && (
                  <span className="label-text-alt text-error">{getFieldError('landingPage')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">ログイン後に最初に表示されるページを選択できます</p>
              </div>

              <div className="divider my-6">やることピックアップ設定</div>

              <div className="form-control">
                <label htmlFor="focusScorePriority" className="label">
                  <span className="label-text font-semibold">スコアリング優先要素</span>
                </label>
                <select
                  id="focusScorePriority"
                  name="focusScorePriority"
                  className={`select select-bordered w-full ${shouldShowError('focusScorePriority') ? 'select-error' : ''}`}
                  value={formData.focusScorePriority ?? 'Deadline'}
                  onChange={(e) => handleFieldChange('focusScorePriority', e.target.value)}
                  disabled={isSubmitting}
                >
                  {FOCUS_SCORE_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {shouldShowError('focusScorePriority') && (
                  <span className="label-text-alt text-error">{getFieldError('focusScorePriority')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">
                  {
                    FOCUS_SCORE_PRIORITY_OPTIONS.find(
                      (opt) => opt.value === (formData.focusScorePriority ?? 'Deadline'),
                    )?.description
                  }
                </p>
              </div>

              <div className="form-control">
                <Slider
                  min={5}
                  max={20}
                  step={1}
                  name="focusTasksLimit"
                  value={formData.focusTasksLimit}
                  onChange={(value) => handleFieldChange('focusTasksLimit', value)}
                  label="やることピックアップタスクの表示件数"
                  showValue
                  valueFormatter={(value) => `${value}件`}
                  disabled={isSubmitting}
                  ariaLabel="やることピックアップタスクの表示件数"
                />
                {shouldShowError('focusTasksLimit') && (
                  <span className="label-text-alt text-error">{getFieldError('focusTasksLimit')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">
                  着手可能なタスクのうち、上位何件を表示するか設定します
                </p>
              </div>

              <div className="form-control">
                <Slider
                  min={5}
                  max={20}
                  step={1}
                  name="waitingTasksLimit"
                  value={formData.waitingTasksLimit}
                  onChange={(value) => handleFieldChange('waitingTasksLimit', value)}
                  label="待機中タスクの表示件数"
                  showValue
                  valueFormatter={(value) => `${value}件`}
                  disabled={isSubmitting}
                  ariaLabel="待機中タスクの表示件数"
                />
                {shouldShowError('waitingTasksLimit') && (
                  <span className="label-text-alt text-error">{getFieldError('waitingTasksLimit')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">
                  先行タスクが未完了で待機中のタスクのうち、上位何件を表示するか設定します
                </p>
              </div>

              {showBadgeVisibilitySetting && (
                <>
                  <div className="divider my-6">バッジ設定</div>

                  <div className="form-control">
                    <label htmlFor="badgeVisibility" className="label">
                      <span className="label-text font-semibold">バッジの公開範囲</span>
                    </label>
                    <select
                      id="badgeVisibility"
                      name="badgeVisibility"
                      className={`select select-bordered w-full ${shouldShowError('badgeVisibility') ? 'select-error' : ''}`}
                      value={formData.badgeVisibility ?? ''}
                      onChange={(e) => handleFieldChange('badgeVisibility', e.target.value || undefined)}
                      disabled={isSubmitting}
                    >
                      <option value="">組織のデフォルト設定に従う</option>
                      {BADGE_VISIBILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {shouldShowError('badgeVisibility') && (
                      <span className="label-text-alt text-error">{getFieldError('badgeVisibility')}</span>
                    )}
                    <p className="text-sm text-base-content/70 mt-1">
                      あなたが獲得したバッジを他のユーザーに公開する範囲を設定します。
                      「組織のデフォルト設定に従う」を選択すると、管理者が設定した公開範囲が適用されます。
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                {/* 競合アラート */}
                <ConflictAlert
                  isConflict={isConflict}
                  latestData={conflictData}
                  onOverwrite={async (latestRowVersion) => {
                    setIsConflict(false);
                    setConflictData(null);

                    try {
                      const result = await updateUserSetting({
                        canReceiveEmail: formData.canReceiveEmail,
                        emailNotificationMode: formData.emailNotificationMode,
                        customEmailSettings: formData.customEmailSettings,
                        emailWorkspaceIds: formData.emailWorkspaceIds,
                        canReceiveWeeklyReport: formData.canReceiveWeeklyReport,
                        canReceiveRealtimeNotification: formData.canReceiveRealtimeNotification,
                        timeZone: formData.timeZone,
                        language: formData.language,
                        landingPage: formData.landingPage as LandingPage | undefined,
                        focusScorePriority: formData.focusScorePriority as FocusScorePriority | undefined,
                        focusTasksLimit: formData.focusTasksLimit,
                        waitingTasksLimit: formData.waitingTasksLimit,
                        badgeVisibility: formData.badgeVisibility as BadgeVisibility | undefined,
                        rowVersion: latestRowVersion,
                      });

                      if (result.success) {
                        syncWithResponse(result.data);
                        notify.success('設定を保存しました');
                      } else if (
                        !result.success &&
                        result.error === 'conflict' &&
                        'latest' in result &&
                        result.latest
                      ) {
                        const latest = result.latest.data as UserSettingResponse;
                        setConflictData(latest);
                        setIsConflict(true);
                      } else {
                        notify.error(result.message || '保存に失敗しました');
                      }
                    } catch (error) {
                      console.error('Settings update error:', error);
                      notify.error('予期しないエラーが発生しました');
                    }
                  }}
                  onDiscard={(latestData) => {
                    syncWithResponse(latestData);
                    setIsConflict(false);
                    setConflictData(null);
                  }}
                  isProcessing={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    resetForm();
                    syncWithResponse(initialSettings);
                  }}
                  disabled={isSubmitting}
                >
                  リセット
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || isConflict}>
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
