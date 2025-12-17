'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteWorkspace } from '@/actions/deleteWorkspace';
import {
  addMemberToWorkspace,
  removeMemberFromWorkspace,
  toggleWorkspaceActive,
  updateMemberRoleInWorkspace,
} from '@/actions/workspace';
import { addWorkspaceItemRelations, fetchLatestWorkspaceItem } from '@/actions/workspaceItem';
import { getWorkspaceTaskBySequence } from '@/actions/workspaceTask';
import AppHeader from '@/components/common/layout/AppHeader';
import DeleteWorkspaceModal from '@/components/common/overlays/DeleteWorkspaceModal';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { WorkspaceItemsSidebarHandle } from '@/components/workspaceItems/WorkspaceItemsSidebar';
import WorkspaceItemsSidebar from '@/components/workspaceItems/WorkspaceItemsSidebar';
import AddMemberModal from '@/components/workspaces/AddMemberModal';
import ChangeRoleModal from '@/components/workspaces/ChangeRoleModal';
import EditWorkspaceModal from '@/components/workspaces/EditWorkspaceModal';
import EditWorkspaceSkillsModal from '@/components/workspaces/EditWorkspaceSkillsModal';
import RemoveMemberModal from '@/components/workspaces/RemoveMemberModal';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import WorkspaceMemberList from '@/components/workspaces/WorkspaceMemberList';
import WorkspacePresence from '@/components/workspaces/WorkspacePresence';
import type {
  MasterGenreResponse,
  MasterSkillResponse,
  TaskFlowNode,
  TaskStatusFilter,
  WorkspaceDetailUserResponse,
  WorkspaceFullDetailResponse,
  WorkspaceRole,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { WorkspacePresenceUser } from '@/providers/SignalRProvider';
import { type SignalRNotification, useSignalRContext } from '@/providers/SignalRProvider';
import type { UserInfo } from '@/types/userInfo';
import CreateWorkspaceItem from './CreateWorkspaceItem';
import TaskFlowMapPage from './TaskFlowMapPage';
import WorkspaceItemDetail, { type WorkspaceItemDetailHandle } from './WorkspaceItemDetail';
import WorkspaceTaskDetailPage from './WorkspaceTaskDetailPage';

/** タスクナビゲーション情報 */
interface TaskNavigation {
  /** 現在表示中のタスク一覧（現在のページ） */
  tasks: WorkspaceTaskDetailResponse[];
  /** 一覧内での現在のインデックス */
  currentIndex: number;
  /** 一覧のページ番号 */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総タスク数 */
  totalCount: number;
  /** フィルター条件 */
  statusFilter: TaskStatusFilter;
  assignedUserId?: number;
}

interface WorkspaceDetailClientProps {
  workspaceCode: string;
  workspaceDetail: WorkspaceFullDetailResponse;
  userInfo: UserInfo | null;
  genres: MasterGenreResponse[];
  skills: MasterSkillResponse[];
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** URLクエリパラメータで指定された初期選択アイテムID */
  initialItemId?: number;
  /** URLクエリパラメータで指定された初期選択アイテムコード */
  initialItemCode?: string;
  /** 初期スクロールターゲット (例: 'tasks') */
  initialScrollTarget?: string;
  /** URLクエリパラメータで指定された初期選択タスクシーケンス */
  initialTaskSequence?: number;
}

export default function WorkspaceDetailClient({
  workspaceCode,
  workspaceDetail,
  userInfo,
  genres,
  skills,
  taskTypes,
  initialItemId,
  initialItemCode,
  initialScrollTarget,
  initialTaskSequence,
}: WorkspaceDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const notify = useNotify();
  const { connectionState, joinWorkspace, leaveWorkspace, onNotification } = useSignalRContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_isLoading, _setIsLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  // プレゼンス初期ユーザー一覧（joinWorkspaceの戻り値）
  const [initialPresenceUsers, setInitialPresenceUsers] = useState<WorkspacePresenceUser[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarComponentRef = useRef<WorkspaceItemsSidebarHandle>(null);
  const mobileSidebarComponentRef = useRef<WorkspaceItemsSidebarHandle>(null);
  const itemDetailRef = useRef<WorkspaceItemDetailHandle>(null);
  // initialItemId が指定されている場合は、最初からアイテム詳細を表示
  const [showWorkspaceDetail, setShowWorkspaceDetail] = useState(!initialItemId);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(initialItemId ?? null);
  // アイテムコード（URL生成用）
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(initialItemCode ?? null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ===== スクロールターゲット状態（一度使用したらクリア）=====
  const [scrollTarget, setScrollTarget] = useState<string | null>(initialScrollTarget ?? null);

  // ===== 関連アイテム選択モードの状態 =====
  const [isAddingRelation, setIsAddingRelation] = useState(false);

  // ===== タスク詳細ページの状態 =====
  // initialTaskSequenceがある場合も、タスクリストロード後に自動で開くため最初はfalse
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [taskDetailNavigation, setTaskDetailNavigation] = useState<TaskNavigation | null>(null);
  const [taskDetailItemId, setTaskDetailItemId] = useState<number | null>(null);
  const [taskDetailItemCommitterId, setTaskDetailItemCommitterId] = useState<number | null>(null);
  const [taskDetailItemCommitterName, setTaskDetailItemCommitterName] = useState<string | null>(null);
  const [taskDetailItemCommitterAvatarUrl, setTaskDetailItemCommitterAvatarUrl] = useState<string | null>(null);
  // タスク詳細からフローマップ遷移用の追加情報
  const [taskDetailItemOwnerId, setTaskDetailItemOwnerId] = useState<number | null>(null);
  const [taskDetailItemAssigneeId, setTaskDetailItemAssigneeId] = useState<number | null>(null);
  const [taskDetailItemTitle, setTaskDetailItemTitle] = useState<string | null>(null);
  // URLから復元するためのタスクシーケンス
  const [pendingTaskSequence, setPendingTaskSequence] = useState<number | null>(initialTaskSequence ?? null);

  // ===== タスクフローマップページの状態 =====
  const [showFlowMap, setShowFlowMap] = useState(false);
  const [flowMapItemTitle, setFlowMapItemTitle] = useState<string | null>(null);
  const [flowMapItemCommitterName, setFlowMapItemCommitterName] = useState<string | null>(null);
  const [flowMapItemCommitterAvatarUrl, setFlowMapItemCommitterAvatarUrl] = useState<string | null>(null);
  const [flowMapItemOwnerId, setFlowMapItemOwnerId] = useState<number | null>(null);
  const [flowMapItemAssigneeId, setFlowMapItemAssigneeId] = useState<number | null>(null);
  const [flowMapItemCommitterId, setFlowMapItemCommitterId] = useState<number | null>(null);

  // ===== モバイルドロワーの状態 =====
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(true);

  // ===== アクションメニューの状態 =====
  const [openActionMenu, setOpenActionMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentWorkspaceDetail, setCurrentWorkspaceDetail] = useState<WorkspaceFullDetailResponse>(workspaceDetail);

  // ===== メンバー管理の状態 =====
  // ログインユーザーがOwnerかどうか
  const isOwner = currentWorkspaceDetail.currentUserRole === 'Owner';

  // メンバー一覧（状態管理）
  const [members, setMembers] = useState<WorkspaceDetailUserResponse[]>(workspaceDetail.members || []);

  // 新規追加されたメンバーのハイライト表示用（3秒間）
  const [highlightedUserIds, setHighlightedUserIds] = useState<Set<number>>(new Set());

  // メンバー追加モーダルの状態
  const [addMemberModal, setAddMemberModal] = useState(false);

  // 削除モーダルの状態
  const [removeMemberModal, setRemoveMemberModal] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    email: string;
  }>({ isOpen: false, userId: 0, userName: '', email: '' });

  // ロール変更モーダルの状態
  const [changeRoleModal, setChangeRoleModal] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    currentRole: WorkspaceRole;
    newRole: WorkspaceRole;
  }>({ isOpen: false, userId: 0, userName: '', currentRole: 'Member', newRole: 'Member' });

  // サイドバー幅（初期値: null → クライアントサイドでローカルストレージから復元）
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);

  // クライアントサイドでローカルストレージから幅を復元
  useEffect(() => {
    const saved = localStorage.getItem('workspaceSidebarWidth');
    if (saved) {
      const width = parseInt(saved, 10);
      if (!Number.isNaN(width) && width >= 200 && width <= 600) {
        setSidebarWidth(width);
        return;
      }
    }
    // 保存値がない場合はデフォルト値
    setSidebarWidth(256);
  }, []);

  // 外部クリックでアクションメニューを閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      if (openActionMenu) {
        setOpenActionMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openActionMenu]);

  // ブラウザの戻る/進むボタンに対応
  useEffect(() => {
    const handlePopState = () => {
      // URLからパラメータを取得
      const urlParams = new URLSearchParams(window.location.search);
      const itemCodeParam = urlParams.get('itemCode');
      const taskParam = urlParams.get('task');

      if (itemCodeParam) {
        // taskパラメータがある場合は、タスク詳細を表示
        if (taskParam) {
          const taskSequence = parseInt(taskParam, 10);
          if (!Number.isNaN(taskSequence)) {
            // 現在のタスク詳細を閉じて、新しいタスクをロード
            setShowTaskDetail(false);
            setTaskDetailNavigation(null);
            setPendingTaskSequence(taskSequence);
            return;
          }
        }
        // taskパラメータがない場合は、タスク詳細を閉じてアイテム詳細を表示
        if (showTaskDetail) {
          setShowTaskDetail(false);
          setTaskDetailNavigation(null);
          setTaskDetailItemId(null);
          setPendingTaskSequence(null);
        }
      } else {
        // itemCodeがない場合はホーム表示
        setShowWorkspaceDetail(true);
        setSelectedItemId(null);
        setShowTaskDetail(false);
        setTaskDetailNavigation(null);
        setPendingTaskSequence(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showTaskDetail]);

  // ===== SignalR ワークスペースグループ参加・離脱 =====
  const workspaceIdRef = useRef<number | null>(null);
  const hasJoinedRef = useRef(false);
  const joinWorkspaceRef = useRef(joinWorkspace);
  joinWorkspaceRef.current = joinWorkspace;

  // setInitialPresenceUsersをrefで保持
  const setInitialPresenceUsersRef = useRef(setInitialPresenceUsers);
  setInitialPresenceUsersRef.current = setInitialPresenceUsers;

  useEffect(() => {
    const workspaceId = currentWorkspaceDetail.id;

    // 接続が確立されていて、まだ参加していない場合のみ参加
    if (connectionState === 'connected' && workspaceId && !hasJoinedRef.current) {
      workspaceIdRef.current = workspaceId;
      hasJoinedRef.current = true;
      // joinWorkspaceは既存ユーザー一覧を返す
      joinWorkspaceRef.current(workspaceId).then((users) => {
        setInitialPresenceUsersRef.current(users);
      });
    }

    // 切断された場合はフラグをリセット（再接続時に再参加できるように）
    if (connectionState === 'disconnected') {
      hasJoinedRef.current = false;
      setInitialPresenceUsersRef.current([]);
    }
  }, [connectionState, currentWorkspaceDetail.id]); // joinWorkspace を依存配列から削除

  // ワークスペースが変わった場合の処理（別のuseEffect）
  const leaveWorkspaceRef = useRef(leaveWorkspace);
  leaveWorkspaceRef.current = leaveWorkspace;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      const workspaceToLeave = workspaceIdRef.current;

      // React Strict Mode 対策: 少し遅延させて本当にアンマウントか確認
      setTimeout(() => {
        if (!isMountedRef.current && workspaceToLeave !== null) {
          leaveWorkspaceRef.current(workspaceToLeave);
        }
      }, 100);

      workspaceIdRef.current = null;
      hasJoinedRef.current = false;
    };
  }, []); // 空の依存配列 - アンマウント時のみ実行

  // ===== SignalR 通知受信ハンドラー =====
  // コンポーネントマウント時に一度だけ登録し、アンマウント時にクリーンアップ
  useEffect(() => {
    const handler = (notification: SignalRNotification) => {
      // workspace:user_joined/left は WorkspacePresence で処理するためスキップ
      if (notification.eventType === 'workspace:user_joined' || notification.eventType === 'workspace:user_left') {
        return;
      }
      // 将来の通知ハンドリング用に予約
      // 例: workspace:item_created, workspace:item_updated など
      console.log('[WorkspaceDetail] Received notification:', notification.eventType);
    };

    const unsubscribe = onNotification(handler);

    return unsubscribe;
    // notify を依存配列から除外（useRef ベースのため参照は安定）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotification]);

  // ===== pendingTaskSequence がある場合にタスクを直接取得してタスク詳細ページを開く =====
  useEffect(() => {
    // pendingTaskSequence がない、または既にタスク詳細が表示中なら何もしない
    if (pendingTaskSequence === null || showTaskDetail || !selectedItemId) {
      return;
    }

    const loadTaskBySequence = async () => {
      try {
        // シーケンス番号で直接タスクを取得（1件取得API）
        const result = await getWorkspaceTaskBySequence(currentWorkspaceDetail.id, selectedItemId, pendingTaskSequence);

        if (result.success && result.data) {
          const task = result.data;
          // タスクナビゲーション情報を構築（1件のみ）
          const navigation: TaskNavigation = {
            tasks: [task],
            currentIndex: 0,
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
            statusFilter: 'All',
          };

          // タスク詳細ページを表示
          setTaskDetailItemId(selectedItemId);
          setTaskDetailNavigation(navigation);
          setShowTaskDetail(true);
        }
      } catch (error) {
        console.error('Failed to load task by sequence:', error);
      } finally {
        // 処理完了、pendingをクリア
        setPendingTaskSequence(null);
      }
    };

    loadTaskBySequence();
  }, [pendingTaskSequence, showTaskDetail, selectedItemId, currentWorkspaceDetail.id]);

  // ===== メンバー管理のコールバック（Owner専用） =====

  /** メンバー追加モーダルを開く */
  const handleAddMember = () => {
    setAddMemberModal(true);
  };

  /** メンバー追加モーダルを閉じる */
  const handleAddMemberModalClose = () => {
    setAddMemberModal(false);
  };

  /** メンバー追加を実行 */
  const handleAddMemberConfirm = async (
    userId: number,
    userName: string,
    email: string,
    role: WorkspaceRole,
    identityIconUrl: string | null,
  ) => {
    const result = await addMemberToWorkspace(workspaceDetail.id, userId, role);

    if (result.success) {
      // メンバー一覧に追加
      const newMember: WorkspaceDetailUserResponse = {
        id: userId,
        userName,
        email,
        workspaceRole: role,
        isActive: true,
        identityIconUrl: identityIconUrl ?? undefined,
      };
      setMembers((prev) => [...prev, newMember]);

      // 新規メンバーを3秒間ハイライト表示
      setHighlightedUserIds((prev) => new Set([...prev, userId]));
      setTimeout(() => {
        setHighlightedUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }, 3000);

      notify.success(`${userName} をワークスペースに追加しました。`);
      handleAddMemberModalClose();
    } else {
      notify.error(result.message || 'メンバーの追加に失敗しました。');
    }
  };

  /** メンバー削除モーダルを開く */
  const handleRemoveMember = (userId: number, userName: string) => {
    const member = members.find((m) => m.id === userId);
    const email = member?.email || '';
    setRemoveMemberModal({ isOpen: true, userId, userName, email });
  };

  /** メンバー削除モーダルを閉じる */
  const handleRemoveMemberModalClose = () => {
    setRemoveMemberModal({ isOpen: false, userId: 0, userName: '', email: '' });
  };

  /** メンバー削除を実行 */
  const handleRemoveMemberConfirm = async () => {
    const { userId, userName } = removeMemberModal;
    const result = await removeMemberFromWorkspace(workspaceDetail.id, userId);

    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      notify.success(`${userName} をワークスペースから削除しました。`);
    } else {
      notify.error(result.message || 'メンバーの削除に失敗しました。');
    }

    handleRemoveMemberModalClose();
  };

  /** ロール変更モーダルを開く */
  const handleChangeRole = (userId: number, userName: string, newRole: WorkspaceRole) => {
    const member = members.find((m) => m.id === userId);
    const currentRole = member?.workspaceRole || 'Member';

    if (currentRole === newRole) {
      return;
    }

    setChangeRoleModal({
      isOpen: true,
      userId,
      userName,
      currentRole,
      newRole,
    });
  };

  /** ロール変更モーダルを閉じる */
  const handleChangeRoleModalClose = () => {
    setChangeRoleModal({
      isOpen: false,
      userId: 0,
      userName: '',
      currentRole: 'Member',
      newRole: 'Member',
    });
  };

  /** ロール変更を実行 */
  const handleChangeRoleConfirm = async () => {
    const { userId, userName, newRole } = changeRoleModal;
    const result = await updateMemberRoleInWorkspace(workspaceDetail.id, userId, newRole);

    if (result.success) {
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, workspaceRole: newRole } : m)));
      notify.success(`${userName} のロールを変更しました。`);
    } else {
      notify.error(result.message || 'ロールの変更に失敗しました。');
    }

    handleChangeRoleModalClose();
  };

  // ===== ワークスペースアクションメニューのコールバック =====

  /** アクションメニューを開閉 */
  const handleActionMenuToggle = () => {
    setOpenActionMenu(!openActionMenu);
  };

  /** 編集モーダルを開く */
  const handleEdit = () => {
    setOpenActionMenu(false);
    setIsEditModalOpen(true);
  };

  /** スキル編集モーダルを開く */
  const handleSkills = () => {
    setOpenActionMenu(false);
    setIsSkillsModalOpen(true);
  };

  /** スキル編集成功時のハンドラ */
  const handleSkillsSuccess = (updatedWorkspace: WorkspaceFullDetailResponse) => {
    setCurrentWorkspaceDetail(updatedWorkspace);
  };

  /** 編集成功時のハンドラ */
  const handleEditSuccess = async (updatedWorkspace: WorkspaceFullDetailResponse) => {
    // バックエンドから返されたデータでローカルの状態を更新
    setCurrentWorkspaceDetail(updatedWorkspace);

    // 成功通知
    notify.success('ワークスペースを更新しました。');
  };

  /** 有効化/無効化を実行 */
  const handleToggleActive = async () => {
    setOpenActionMenu(false);

    try {
      const result = await toggleWorkspaceActive(currentWorkspaceDetail.id, !currentWorkspaceDetail.isActive);

      if (result.success) {
        // ローカルの状態を更新
        setCurrentWorkspaceDetail((prev) => ({
          ...prev,
          isActive: !prev.isActive,
        }));

        notify.success(
          currentWorkspaceDetail.isActive ? 'ワークスペースを無効化しました。' : 'ワークスペースを有効化しました。',
        );
      } else {
        notify.error(result.message || '状態の切り替えに失敗しました。');
      }
    } catch (error) {
      console.error('Toggle active failed:', error);
      notify.error('状態の切り替えに失敗しました。');
    }
  };

  /** 削除モーダルを開く */
  const handleDelete = () => {
    setOpenActionMenu(false);
    setIsDeleteModalOpen(true);
  };

  /** 削除を実行 */
  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteWorkspace(currentWorkspaceDetail.id);

      if (result.success) {
        notify.success('ワークスペースを削除しました。');
        // ワークスペース一覧ページにリダイレクト
        router.push('/workspaces');
      } else {
        notify.error(result.message || 'ワークスペースの削除に失敗しました。');
      }
    } catch (error) {
      console.error('Delete workspace failed:', error);
      notify.error('ワークスペースの削除に失敗しました。');
    }
  };

  // ===== ワークスペースアイテム関連のコールバック =====

  // ワークスペースHome選択ハンドラ
  const handleHomeSelect = useCallback(() => {
    setShowWorkspaceDetail(true);
    setSelectedItemId(null);
    setSelectedItemCode(null);
    setShowTaskDetail(false);
    setTaskDetailNavigation(null);
    setPendingTaskSequence(null);
    setScrollTarget(null); // スクロールターゲットをクリア
    // URLからitemIdパラメータを削除
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // アイテム選択ハンドラ
  const handleItemSelect = useCallback(
    (itemId: number, itemCode: string) => {
      setShowWorkspaceDetail(false);
      setSelectedItemId(itemId);
      setSelectedItemCode(itemCode);
      setShowTaskDetail(false);
      setTaskDetailNavigation(null);
      setPendingTaskSequence(null);
      setScrollTarget(null); // スクロールターゲットをクリア（別アイテム選択時）
      // URLにitemCodeパラメータを追加（scrollToは含めない）
      router.push(`${pathname}?itemCode=${itemCode}`, { scroll: false });
    },
    [router, pathname],
  );

  // タスク詳細ページを表示するハンドラ
  const handleShowTaskDetail = useCallback(
    (
      taskSequence: number,
      itemCode: string,
      navigation: TaskNavigation,
      itemCommitterId: number | null,
      itemCommitterName: string | null,
      itemCommitterAvatarUrl: string | null,
      itemOwnerId: number | null,
      itemAssigneeId: number | null,
      itemTitle: string | null,
    ) => {
      setTaskDetailItemId(selectedItemId);
      setTaskDetailNavigation(navigation);
      setTaskDetailItemCommitterId(itemCommitterId);
      setTaskDetailItemCommitterName(itemCommitterName);
      setTaskDetailItemCommitterAvatarUrl(itemCommitterAvatarUrl);
      setTaskDetailItemOwnerId(itemOwnerId);
      setTaskDetailItemAssigneeId(itemAssigneeId);
      setTaskDetailItemTitle(itemTitle);
      setShowTaskDetail(true);
      setPendingTaskSequence(null); // URL復元時のpendingをクリア
      // URLを更新（task=シーケンス番号）
      router.push(`${pathname}?itemCode=${itemCode}&task=${taskSequence}`, { scroll: false });
    },
    [router, pathname, selectedItemId],
  );

  // タスク詳細ページを閉じるハンドラ
  const handleCloseTaskDetail = useCallback(() => {
    setShowTaskDetail(false);
    setTaskDetailNavigation(null);
    setTaskDetailItemId(null);
    setTaskDetailItemCommitterId(null);
    setTaskDetailItemCommitterName(null);
    setTaskDetailItemCommitterAvatarUrl(null);
    setTaskDetailItemOwnerId(null);
    setTaskDetailItemAssigneeId(null);
    setTaskDetailItemTitle(null);
    setPendingTaskSequence(null);
    // URLからtaskパラメータを削除
    if (selectedItemCode) {
      router.push(`${pathname}?itemCode=${selectedItemCode}`, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  }, [router, pathname, selectedItemCode]);

  // タスク詳細ページ更新成功時のハンドラ
  const handleTaskDetailSuccess = useCallback(() => {
    // アイテム詳細のタスクリストを更新
    itemDetailRef.current?.refreshItem();
  }, []);

  // タスク詳細画面から指定タスクへ遷移するハンドラ（先行タスクリンク用）
  const handleNavigateToTask = useCallback(
    (taskSequence: number) => {
      if (!selectedItemCode) return;
      // 現在のタスク詳細を閉じて、新しいタスクをロード
      setShowTaskDetail(false);
      setTaskDetailNavigation(null);
      setPendingTaskSequence(taskSequence);
      // URLを更新
      router.push(`${pathname}?itemCode=${selectedItemCode}&task=${taskSequence}`, { scroll: false });
    },
    [router, pathname, selectedItemCode],
  );

  // タスク詳細画面からフローマップへ遷移するハンドラ
  const handleShowFlowMapFromTaskDetail = useCallback(() => {
    // タスク詳細表示時に保持している情報を使用してフローマップを表示
    // 先にフローマップ用の情報を設定
    setFlowMapItemTitle(taskDetailItemTitle);
    setFlowMapItemCommitterName(taskDetailItemCommitterName);
    setFlowMapItemCommitterAvatarUrl(taskDetailItemCommitterAvatarUrl);
    setFlowMapItemOwnerId(taskDetailItemOwnerId);
    setFlowMapItemAssigneeId(taskDetailItemAssigneeId);
    setFlowMapItemCommitterId(taskDetailItemCommitterId);

    // タスク詳細を閉じる（URLは更新しない、フラグのみ）
    setShowTaskDetail(false);
    setTaskDetailNavigation(null);
    setTaskDetailItemId(null);
    setTaskDetailItemCommitterId(null);
    setTaskDetailItemCommitterName(null);
    setTaskDetailItemCommitterAvatarUrl(null);
    setTaskDetailItemOwnerId(null);
    setTaskDetailItemAssigneeId(null);
    setTaskDetailItemTitle(null);
    setPendingTaskSequence(null);

    // フローマップを表示
    setShowFlowMap(true);
  }, [
    taskDetailItemTitle,
    taskDetailItemCommitterName,
    taskDetailItemCommitterAvatarUrl,
    taskDetailItemOwnerId,
    taskDetailItemAssigneeId,
    taskDetailItemCommitterId,
  ]);

  // タスクフローマップページを表示するハンドラ（アイテム詳細から）
  const handleShowFlowMap = useCallback(
    (
      itemTitle: string | null,
      itemCommitterName: string | null,
      itemCommitterAvatarUrl: string | null,
      itemOwnerId: number | null,
      itemAssigneeId: number | null,
      itemCommitterId: number | null,
    ) => {
      setFlowMapItemTitle(itemTitle);
      setFlowMapItemCommitterName(itemCommitterName);
      setFlowMapItemCommitterAvatarUrl(itemCommitterAvatarUrl);
      setFlowMapItemOwnerId(itemOwnerId);
      setFlowMapItemAssigneeId(itemAssigneeId);
      setFlowMapItemCommitterId(itemCommitterId);
      setShowFlowMap(true);
    },
    [],
  );

  // タスクフローマップページを閉じるハンドラ
  const handleCloseFlowMap = useCallback(() => {
    setShowFlowMap(false);
    setFlowMapItemTitle(null);
    setFlowMapItemCommitterName(null);
    setFlowMapItemCommitterAvatarUrl(null);
    setFlowMapItemOwnerId(null);
    setFlowMapItemAssigneeId(null);
    setFlowMapItemCommitterId(null);
  }, []);

  // タスクフローマップ用のタスク編集権限チェック関数
  const canEditTaskForFlowMap = useCallback(
    (task: TaskFlowNode): boolean => {
      if (!userInfo) return false;
      return (
        task.assignedUserId === userInfo.id ||
        flowMapItemCommitterId === userInfo.id ||
        flowMapItemAssigneeId === userInfo.id ||
        flowMapItemOwnerId === userInfo.id
      );
    },
    [userInfo, flowMapItemCommitterId, flowMapItemAssigneeId, flowMapItemOwnerId],
  );

  // スクロール完了後にURLをクリーンアップ
  const handleScrollComplete = useCallback(() => {
    setScrollTarget(null);
    // URLからscrollToパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete('scrollTo');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // 新規作成ハンドラ（モーダルを開く）
  const handleCreateNew = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // モーダルを閉じるハンドラ
  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  // 新規作成完了ハンドラ
  const handleCreateComplete = useCallback(
    (itemId: number, itemCode: string) => {
      setIsCreateModalOpen(false);
      setSelectedItemId(itemId);
      setShowWorkspaceDetail(false);

      // URLにitemCodeパラメータを追加
      router.push(`${pathname}?itemCode=${itemCode}`, { scroll: false });

      // サイドバーのアイテムリストをリロード（新規作成されたアイテムを選択状態に設定）
      sidebarComponentRef.current?.refreshItems(itemId);
    },
    [router, pathname],
  );

  // ===== 関連アイテム追加機能 =====

  // 関連アイテム追加モードをトグル
  const handleStartAddRelation = useCallback(async () => {
    if (!selectedItemId) return;

    // 既に追加モードの場合は解除
    if (isAddingRelation) {
      setIsAddingRelation(false);
      sidebarComponentRef.current?.endSelectionMode();
      mobileSidebarComponentRef.current?.endSelectionMode();
      return;
    }

    // 現在のアイテムの関連アイテムIDリストを取得
    const result = await fetchLatestWorkspaceItem(workspaceDetail.id, selectedItemId);
    const excludeIds: number[] = [selectedItemId];

    if (result.success && result.data.relatedItems) {
      // 既存の関連アイテムIDを除外リストに追加
      for (const related of result.data.relatedItems) {
        if (related.id) {
          excludeIds.push(related.id);
        }
      }
    }

    setIsAddingRelation(true);
    // デスクトップとモバイル両方のサイドバーで選択モードを開始
    sidebarComponentRef.current?.startSelectionMode(selectedItemId, excludeIds);
    mobileSidebarComponentRef.current?.startSelectionMode(selectedItemId, excludeIds);
  }, [selectedItemId, workspaceDetail.id, isAddingRelation]);

  // 関連アイテム選択確定時のハンドラ
  const handleSelectionConfirm = useCallback(
    async (selectedIds: number[]) => {
      if (!selectedItemId || selectedIds.length === 0) {
        setIsAddingRelation(false);
        return;
      }

      try {
        const result = await addWorkspaceItemRelations(workspaceDetail.id, selectedItemId, selectedIds);

        if (result.success) {
          notify.success(`${selectedIds.length} 件のアイテムを関連付けました。`);
          // アイテム詳細を再取得
          await itemDetailRef.current?.refreshItem();
        } else {
          notify.error(result.message || '関連アイテムの追加に失敗しました。');
        }
      } catch (error) {
        console.error('Failed to add relations:', error);
        notify.error('関連アイテムの追加に失敗しました。');
      }

      setIsAddingRelation(false);
    },
    [selectedItemId, workspaceDetail.id, notify],
  );

  // 関連アイテム選択キャンセル時のハンドラ
  const handleSelectionCancel = useCallback(() => {
    setIsAddingRelation(false);
  }, []);

  // アーカイブ完了時のハンドラ（ドキュメントツリー更新用）
  const handleArchiveComplete = useCallback(() => {
    // サイドバーのリストを更新してツリー構造を反映
    sidebarComponentRef.current?.refreshItems();
    mobileSidebarComponentRef.current?.refreshItems();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // 最小幅200px、最大幅600px
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
        // ローカルストレージに保存
        localStorage.setItem('workspaceSidebarWidth', newWidth.toString());
      }
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // マウスイベントリスナーの登録
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // ワークスペースヘッダー部分を共通コンポーネント化
  const WorkspaceHeader = () => (
    <div className="flex items-start justify-between gap-2 mb-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold truncate flex items-center gap-2">
          {currentWorkspaceDetail.genreIcon && (
            <img
              src={`/icons/genres/${currentWorkspaceDetail.genreIcon}.svg`}
              alt={currentWorkspaceDetail.genreName || 'ジャンルアイコン'}
              title={currentWorkspaceDetail.genreName || 'ジャンル'}
              className="w-8 h-8 flex-shrink-0"
            />
          )}
          <span>{currentWorkspaceDetail.name}</span>
        </h2>
        {currentWorkspaceDetail.code && (
          <div className="flex items-center gap-1 mt-2">
            <code className="text-sm badge badge-soft badge-accent badge-md truncate max-w-full">
              {currentWorkspaceDetail.code}
            </code>
            {currentWorkspaceDetail.mode === 'Document' && (
              <span
                className="icon-[mdi--file-document-outline] text-lg align-middle ml-1"
                title="ドキュメントワークスペース"
                aria-label="ドキュメントワークスペース"
              />
            )}
          </div>
        )}
      </div>
      {/* アクションメニュー - Ownerのみ表示（右寄せ） */}
      {isOwner && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleActionMenuToggle();
            }}
            aria-label="アクション"
          >
            <span className="icon-[mdi--dots-vertical] w-5 h-5" aria-hidden="true" />
          </button>
          {openActionMenu && (
            <ul className="absolute right-0 top-10 menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-xl border border-base-300">
              <li>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="icon-[mdi--pencil-outline] w-4 h-4" aria-hidden="true" />
                  <span>編集</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkills();
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="icon-[mdi--lightbulb-outline] w-4 h-4" aria-hidden="true" />
                  <span>スキル</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive();
                  }}
                  className="flex items-center gap-2"
                >
                  {currentWorkspaceDetail.isActive ? (
                    <>
                      <span className="icon-[mdi--toggle-switch-off-outline] w-4 h-4" aria-hidden="true" />
                      <span>無効化</span>
                    </>
                  ) : (
                    <>
                      <span className="icon-[mdi--toggle-switch] w-4 h-4" aria-hidden="true" />
                      <span>有効化</span>
                    </>
                  )}
                </button>
              </li>
              {userInfo?.isAdmin && (
                <>
                  <div className="divider my-0"></div>
                  <li>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="flex items-center gap-2 text-error hover:bg-error hover:text-error-content"
                    >
                      <span className="icon-[mdi--delete-outline] w-4 h-4" aria-hidden="true" />
                      <span>削除</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <AppHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} userInfo={userInfo} />

      {/* スマホ: ヘッダーのみ表示 */}
      <div className="lg:hidden bg-base-100 p-4 border-b border-base-300">
        <WorkspaceHeader />
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* 左サイドバー (PC) */}
        {sidebarWidth !== null && (
          <div
            ref={sidebarRef}
            className="hidden lg:block h-full overflow-hidden relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            <WorkspaceItemsSidebar
              ref={sidebarComponentRef}
              workspaceId={currentWorkspaceDetail.id}
              currentWorkspaceCode={workspaceCode}
              currentWorkspace={{
                name: currentWorkspaceDetail.name,
                code: currentWorkspaceDetail.code ?? '',
                genreIcon: currentWorkspaceDetail.genreIcon,
                genreName: currentWorkspaceDetail.genreName,
                mode: currentWorkspaceDetail.mode,
              }}
              onHomeSelect={handleHomeSelect}
              onItemSelect={handleItemSelect}
              onCreateNew={handleCreateNew}
              initialSelectedItemId={initialItemId}
              currentUser={
                userInfo
                  ? {
                      id: userInfo.id,
                      username: userInfo.username || userInfo.name,
                      email: userInfo.email,
                      identityIconUrl: userInfo.identityIconUrl,
                    }
                  : null
              }
              onSelectionConfirm={handleSelectionConfirm}
              onSelectionCancel={handleSelectionCancel}
            />

            {/* リサイズハンドル */}
            <div
              onMouseDown={handleMouseDown}
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors ${
                isResizing ? 'bg-primary' : ''
              }`}
              style={{ userSelect: 'none' }}
            />
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto bg-base-100 p-4 md:p-6 order-first lg:order-0">
          {/* ワークスペース詳細情報 */}
          {showWorkspaceDetail && (
            <div className="card mb-6">
              <div className="card-body">
                {/* ヘッダー (PC) */}
                <div className="hidden lg:block">
                  <WorkspaceHeader />
                </div>

                {/* 説明 */}
                {currentWorkspaceDetail.description && (
                  <p className="text-base text-base-content/70 mb-4 whitespace-pre-wrap wrap-break-word">
                    {currentWorkspaceDetail.description}
                  </p>
                )}

                {/* メタ情報（4列＋モード） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 py-4 border-y border-base-300 text-sm">
                  {/* モード */}
                  <div>
                    <span className="text-xs text-base-content/70">モード</span>
                    <p className="font-semibold flex items-center gap-2">
                      {currentWorkspaceDetail.mode === 'Document' ? (
                        <>
                          <span
                            className="icon-[mdi--file-document-outline] text-lg align-middle"
                            aria-label="ドキュメントワークスペース"
                          />
                          ドキュメント
                        </>
                      ) : (
                        '通常'
                      )}
                    </p>
                  </div>
                  {/* ジャンル */}
                  {currentWorkspaceDetail.genreName && (
                    <div>
                      <span className="text-xs text-base-content/70">ジャンル</span>
                      <p className="font-semibold flex items-center gap-2">
                        {currentWorkspaceDetail.genreIcon && (
                          <span className="text-xl">{currentWorkspaceDetail.genreIcon}</span>
                        )}
                        {currentWorkspaceDetail.genreName}
                      </p>
                    </div>
                  )}

                  {/* メンバー数 */}
                  <div>
                    <span className="text-xs text-base-content/70">メンバー数</span>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="icon-[mdi--account-outline] w-4 h-4" aria-hidden="true" />
                      {members.length}
                    </p>
                  </div>

                  {/* ステータス */}
                  <div>
                    <span className="text-xs text-base-content/70">ステータス</span>
                    <p className="font-semibold">{currentWorkspaceDetail.isActive ? 'アクティブ' : '非アクティブ'}</p>
                  </div>

                  {/* オーナー */}
                  {currentWorkspaceDetail.owner?.userName && (
                    <div>
                      <span className="text-xs text-base-content/70">オーナー</span>
                      <div className="flex items-center gap-2 mt-1">
                        <UserAvatar
                          userName={currentWorkspaceDetail.owner.userName}
                          identityIconUrl={currentWorkspaceDetail.owner.identityIconUrl}
                          size={20}
                          nameClassName="font-semibold truncate"
                        />
                      </div>
                    </div>
                  )}

                  {/* 作成日時 */}
                  {currentWorkspaceDetail.createdAt && (
                    <div>
                      <span className="text-xs text-base-content/70">作成日時</span>
                      <p className="font-semibold">
                        {new Date(currentWorkspaceDetail.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  )}

                  {/* 更新者 */}
                  {currentWorkspaceDetail.updatedBy?.userName && (
                    <div>
                      <span className="text-xs text-base-content/70">更新者</span>
                      <div className="flex items-center gap-2 mt-1">
                        <UserAvatar
                          userName={currentWorkspaceDetail.updatedBy.userName}
                          identityIconUrl={currentWorkspaceDetail.updatedBy.identityIconUrl}
                          size={20}
                          nameClassName="font-semibold truncate"
                        />
                      </div>
                    </div>
                  )}

                  {/* 更新日時 */}
                  {currentWorkspaceDetail.updatedAt && (
                    <div>
                      <span className="text-xs text-base-content/70">更新日時</span>
                      <p className="font-semibold">
                        {new Date(currentWorkspaceDetail.updatedAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 必要スキル表示 */}
                {currentWorkspaceDetail.skills && currentWorkspaceDetail.skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-base-content/70 mb-2">必要なスキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentWorkspaceDetail.skills.map((skill) => (
                        <span key={skill.id} className="badge badge-accent badge-sm">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* メンバー一覧 - WorkspaceMemberList コンポーネントを使用 */}
                <div className="mt-4">
                  <WorkspaceMemberList
                    members={members}
                    editable={isOwner}
                    ownerId={currentWorkspaceDetail.owner?.id}
                    onAddMember={isOwner ? handleAddMember : undefined}
                    onRemoveMember={isOwner ? handleRemoveMember : undefined}
                    onChangeRole={isOwner ? handleChangeRole : undefined}
                    highlightedUserIds={highlightedUserIds}
                  />
                </div>
              </div>
            </div>
          )}

          {/* タスク詳細ページ */}
          {!showWorkspaceDetail && selectedItemId && showTaskDetail && taskDetailNavigation && taskDetailItemId && (
            <WorkspaceTaskDetailPage
              workspaceId={currentWorkspaceDetail.id}
              itemId={taskDetailItemId}
              itemCommitterId={taskDetailItemCommitterId}
              itemCommitterName={taskDetailItemCommitterName}
              itemCommitterAvatarUrl={taskDetailItemCommitterAvatarUrl}
              initialNavigation={taskDetailNavigation}
              taskTypes={taskTypes}
              currentUser={
                userInfo
                  ? {
                      id: userInfo.id,
                      username: userInfo.username || userInfo.name,
                      email: userInfo.email,
                      identityIconUrl: userInfo.identityIconUrl,
                    }
                  : null
              }
              onClose={handleCloseTaskDetail}
              onSuccess={handleTaskDetailSuccess}
              onShowFlowMap={handleShowFlowMapFromTaskDetail}
              onNavigateToTask={handleNavigateToTask}
            />
          )}

          {/* タスクシーケンスからのロード中 */}
          {!showWorkspaceDetail &&
            selectedItemId &&
            !showTaskDetail &&
            !showFlowMap &&
            pendingTaskSequence !== null && (
              <div className="flex h-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            )}

          {/* タスクフローマップページ */}
          {!showWorkspaceDetail && selectedItemId && !showTaskDetail && showFlowMap && (
            <TaskFlowMapPage
              workspaceId={currentWorkspaceDetail.id}
              itemId={selectedItemId}
              itemCode={selectedItemCode}
              itemTitle={flowMapItemTitle}
              itemCommitterName={flowMapItemCommitterName}
              itemCommitterAvatarUrl={flowMapItemCommitterAvatarUrl}
              onClose={handleCloseFlowMap}
              canEditTask={canEditTaskForFlowMap}
              onTaskClick={(task) => {
                // フローマップを閉じてタスク詳細を表示
                handleCloseFlowMap();
                setPendingTaskSequence(task.sequence);
                // URLを更新
                if (selectedItemCode) {
                  router.push(`${pathname}?itemCode=${selectedItemCode}&task=${task.sequence}`, { scroll: false });
                }
              }}
            />
          )}

          {/* アイテム詳細情報 */}
          {!showWorkspaceDetail &&
            selectedItemId &&
            !showTaskDetail &&
            !showFlowMap &&
            pendingTaskSequence === null && (
              <WorkspaceItemDetail
                ref={itemDetailRef}
                workspaceId={currentWorkspaceDetail.id}
                itemId={selectedItemId}
                itemCode={selectedItemCode}
                onItemSelect={handleItemSelect}
                members={members}
                currentUserId={userInfo?.id}
                taskTypes={taskTypes}
                onStartAddRelation={handleStartAddRelation}
                isAddingRelation={isAddingRelation}
                workspaceMode={currentWorkspaceDetail.mode}
                scrollTarget={scrollTarget}
                onScrollComplete={handleScrollComplete}
                onShowTaskDetail={handleShowTaskDetail}
                onShowFlowMap={handleShowFlowMap}
                onArchiveComplete={handleArchiveComplete}
              />
            )}
        </main>

        {/* メンバー追加モーダル */}
        <AddMemberModal
          isOpen={addMemberModal}
          onClose={handleAddMemberModalClose}
          onConfirm={handleAddMemberConfirm}
          existingMembers={members.map((m) => ({
            userId: m.id ?? 0,
            username: m.userName ?? '',
            email: m.email ?? '',
            identityIconUrl: m.identityIconUrl ?? '',
            workspaceRole: m.workspaceRole,
            isActive: m.isActive,
          }))}
          showSkillMatching={true}
          requiredSkills={
            currentWorkspaceDetail.skills?.map((s) => ({
              id: s.id,
              name: s.name,
            })) ?? []
          }
        />

        {/* メンバー削除モーダル */}
        <RemoveMemberModal
          isOpen={removeMemberModal.isOpen}
          onClose={handleRemoveMemberModalClose}
          onConfirm={handleRemoveMemberConfirm}
          userName={removeMemberModal.userName}
          email={removeMemberModal.email}
        />

        {/* ロール変更モーダル */}
        <ChangeRoleModal
          isOpen={changeRoleModal.isOpen}
          onClose={handleChangeRoleModalClose}
          onConfirm={handleChangeRoleConfirm}
          userName={changeRoleModal.userName}
          currentRole={changeRoleModal.currentRole}
          newRole={changeRoleModal.newRole}
        />

        {/* 新規アイテム作成モーダル */}
        <CreateWorkspaceItem
          workspaceId={currentWorkspaceDetail.id}
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onCreate={handleCreateComplete}
        />

        {/* ワークスペース編集モーダル */}
        <EditWorkspaceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
          onSuccess={handleEditSuccess}
          workspace={
            currentWorkspaceDetail
              ? {
                  id: currentWorkspaceDetail.id,
                  name: currentWorkspaceDetail.name,
                  code: currentWorkspaceDetail.code ?? undefined,
                  description: currentWorkspaceDetail.description ?? undefined,
                  genreId: currentWorkspaceDetail.genreId ?? undefined,
                  genreName: currentWorkspaceDetail.genreName ?? undefined,
                  genreIcon: currentWorkspaceDetail.genreIcon ?? undefined,
                  isActive: currentWorkspaceDetail.isActive ?? true,
                  createdAt: currentWorkspaceDetail.createdAt,
                }
              : null
          }
          genres={genres}
        />

        {/* ワークスペーススキル編集モーダル */}
        <EditWorkspaceSkillsModal
          isOpen={isSkillsModalOpen}
          onClose={() => {
            setIsSkillsModalOpen(false);
          }}
          onSuccess={handleSkillsSuccess}
          workspace={currentWorkspaceDetail}
          skills={skills}
        />

        {/* ワークスペース削除モーダル */}
        <DeleteWorkspaceModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
          }}
          onConfirm={handleDeleteConfirm}
          workspace={
            currentWorkspaceDetail
              ? {
                  id: currentWorkspaceDetail.id,
                  name: currentWorkspaceDetail.name,
                  code: currentWorkspaceDetail.code ?? undefined,
                }
              : null
          }
        />

        {/* アイテム一覧ドロワー (スマホ) */}
        <div
          className={`lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 shadow-lg transition-all duration-300 ease-in-out z-40 ${
            mobileDrawerOpen ? '' : 'translate-y-[calc(100%-48px)]'
          }`}
          style={{ height: mobileDrawerOpen ? '70vh' : '48px', maxHeight: '600px' }}
        >
          {/* ドロワーハンドル */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="w-full h-12 flex items-center justify-center gap-2 bg-base-200 hover:bg-base-300 transition-colors"
            aria-label={mobileDrawerOpen ? 'アイテム一覧を閉じる' : 'アイテム一覧を開く'}
          >
            <div className="w-12 h-1 bg-base-content/30 rounded-full"></div>
            <span className="text-sm font-medium text-base-content/70">
              {mobileDrawerOpen ? '閉じる' : 'アイテム一覧'}
            </span>
            <span
              className={`icon-[mdi--chevron-up] size-5 transition-transform duration-300 ${mobileDrawerOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {/* ドロワーコンテンツ */}
          <div className="h-[calc(100%-48px)] overflow-hidden">
            <WorkspaceItemsSidebar
              ref={mobileSidebarComponentRef}
              workspaceId={currentWorkspaceDetail.id}
              currentWorkspaceCode={workspaceCode}
              currentWorkspace={{
                name: currentWorkspaceDetail.name,
                code: currentWorkspaceDetail.code ?? '',
                genreIcon: currentWorkspaceDetail.genreIcon,
                genreName: currentWorkspaceDetail.genreName,
                mode: currentWorkspaceDetail.mode,
              }}
              onHomeSelect={handleHomeSelect}
              onItemSelect={(itemId, itemCode) => {
                handleItemSelect(itemId, itemCode);
                setMobileDrawerOpen(false); // アイテム選択時にドロワーを閉じる
              }}
              onCreateNew={handleCreateNew}
              initialSelectedItemId={initialItemId}
              currentUser={
                userInfo
                  ? {
                      id: userInfo.id,
                      username: userInfo.username || userInfo.name,
                      email: userInfo.email,
                      identityIconUrl: userInfo.identityIconUrl,
                    }
                  : null
              }
              onSelectionConfirm={handleSelectionConfirm}
              onSelectionCancel={handleSelectionCancel}
            />
          </div>
        </div>
      </div>

      {/* ワークスペース参加者のリアルタイム表示 */}
      {userInfo && (
        <WorkspacePresence
          workspaceId={currentWorkspaceDetail.id}
          currentUserId={userInfo.id}
          initialUsers={initialPresenceUsers}
        />
      )}
    </div>
  );
}
