'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteWorkspace } from '@/actions/deleteWorkspace';
import {
  addMemberToWorkspace,
  getMyWorkspaces,
  removeMemberFromWorkspace,
  toggleWorkspaceActive,
  updateMemberRoleInWorkspace,
} from '@/actions/workspace';
import AppHeader from '@/components/common/AppHeader';
import DeleteWorkspaceModal from '@/components/common/DeleteWorkspaceModal';
import AddMemberModal from '@/components/workspaces/AddMemberModal';
import ChangeRoleModal from '@/components/workspaces/ChangeRoleModal';
import RemoveMemberModal from '@/components/workspaces/RemoveMemberModal';
import WorkspaceMemberList from '@/components/workspaces/WorkspaceMemberList';
import type {
  MasterGenreResponse,
  WorkspaceDetailUserResponse,
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponse,
  WorkspaceRole,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';
import EditWorkspaceModal from '../EditWorkspaceModal';
import CreateWorkspaceItem from './CreateWorkspaceItem';
import WorkspaceItemDetail from './WorkspaceItemDetail';
import type { WorkspaceItemsSidebarHandle } from './WorkspaceItemsSidebar';
import WorkspaceItemsSidebar from './WorkspaceItemsSidebar';

interface WorkspaceDetailClientProps {
  workspaceCode: string;
  workspaceDetail: WorkspaceFullDetailResponse;
  workspaces: WorkspaceListItemResponse[];
  userInfo: UserInfo | null;
  genres: MasterGenreResponse[];
}

export default function WorkspaceDetailClient({
  workspaceCode,
  workspaceDetail,
  workspaces,
  userInfo,
  genres,
}: WorkspaceDetailClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_isLoading, _setIsLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarComponentRef = useRef<WorkspaceItemsSidebarHandle>(null);
  const [showWorkspaceDetail, setShowWorkspaceDetail] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ===== アクションメニューの状態 =====
  const [openActionMenu, setOpenActionMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentWorkspaceDetail, setCurrentWorkspaceDetail] = useState<WorkspaceFullDetailResponse>(workspaceDetail);

  // workspaces もローカル状態として管理（WorkspaceSwitcher の更新用）
  const [currentWorkspaces, setCurrentWorkspaces] = useState<WorkspaceListItemResponse[]>(workspaces);

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

  /** 編集成功時のハンドラ */
  const handleEditSuccess = async (updatedWorkspace: WorkspaceFullDetailResponse) => {
    // ローカルの状態を更新（更新されたフィールドをマージ、currentUserRole などは維持）
    setCurrentWorkspaceDetail((prev) => ({
      ...prev,
      ...updatedWorkspace,
      // currentUserRole は更新レスポンスに含まれない可能性があるため、既存の値を維持
      currentUserRole: updatedWorkspace.currentUserRole ?? prev.currentUserRole,
      // members も既存の値を維持（更新レスポンスに含まれない場合）
      members: updatedWorkspace.members ?? prev.members,
      // owner も既存の値を維持
      owner: updatedWorkspace.owner ?? prev.owner,
    }));

    // バックエンドからワークスペースリストを再取得（WorkspaceSwitcher のドロップダウンに反映）
    const result = await getMyWorkspaces();
    if (result.success) {
      setCurrentWorkspaces(result.data);
    }

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

        // バックエンドからワークスペースリストを再取得（WorkspaceSwitcher のドロップダウンに反映）
        const workspacesResult = await getMyWorkspaces();
        if (workspacesResult.success) {
          setCurrentWorkspaces(workspacesResult.data);
        }

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
  }, []);

  // アイテム選択ハンドラ
  const handleItemSelect = useCallback((itemId: number) => {
    setShowWorkspaceDetail(false);
    setSelectedItemId(itemId);
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
  const handleCreateComplete = useCallback((itemId: number) => {
    setIsCreateModalOpen(false);
    setSelectedItemId(itemId);
    setShowWorkspaceDetail(false);

    // サイドバーのアイテムリストをリロード（新規作成されたアイテムを選択状態に設定）
    sidebarComponentRef.current?.refreshItems(itemId);
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
              className="w-8 h-8 flex-shrink-0"
            />
          )}
          <span>{currentWorkspaceDetail.name}</span>
        </h2>
        {currentWorkspaceDetail.code && (
          <code className="text-sm badge badge-ghost badge-md mt-2 truncate max-w-full block">
            {currentWorkspaceDetail.code}
          </code>
        )}
      </div>
      {/* アクションメニュー - Ownerのみ表示（右寄せ） */}
      {isOwner && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleActionMenuToggle();
            }}
            aria-label="アクション"
          >
            <MoreVertIcon className="w-5 h-5" />
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
                  <EditIcon className="w-4 h-4" />
                  <span>編集</span>
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
                      <ToggleOffIcon className="w-4 h-4" />
                      <span>無効化</span>
                    </>
                  ) : (
                    <>
                      <ToggleOnIcon className="w-4 h-4" />
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
                      <DeleteIcon className="w-4 h-4" />
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
      <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userInfo={userInfo} />

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
              workspaces={currentWorkspaces}
              onHomeSelect={handleHomeSelect}
              onItemSelect={handleItemSelect}
              onCreateNew={handleCreateNew}
              scrollContainerId="itemsScrollableDiv-desktop"
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
        <main className="flex-1 overflow-y-auto bg-base-100 p-4 md:p-6 order-first lg:order-none">
          {/* ワークスペース詳細情報 */}
          {showWorkspaceDetail && (
            <div className="card bg-base-100 shadow-md mb-6">
              <div className="card-body">
                {/* ヘッダー (PC) */}
                <div className="hidden lg:block">
                  <WorkspaceHeader />
                </div>

                {/* 説明 */}
                {currentWorkspaceDetail.description && (
                  <p className="text-base text-base-content/70 mb-4 whitespace-pre-wrap break-words">
                    {currentWorkspaceDetail.description}
                  </p>
                )}

                {/* メタ情報（4列） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 py-4 border-y border-base-300 text-sm">
                  {/* ステータス */}
                  <div>
                    <span className="text-xs text-base-content/70">ステータス</span>
                    <p className="font-semibold">{currentWorkspaceDetail.isActive ? 'アクティブ' : '非アクティブ'}</p>
                  </div>

                  {/* 作成日時 */}
                  {currentWorkspaceDetail.createdAt && (
                    <div>
                      <span className="text-xs text-base-content/70">作成日時</span>
                      <p className="font-semibold">
                        {new Date(currentWorkspaceDetail.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  )}

                  {/* オーナー */}
                  {currentWorkspaceDetail.owner?.userName && (
                    <div>
                      <span className="text-xs text-base-content/70">オーナー</span>
                      <div className="flex items-center gap-2 mt-1">
                        {currentWorkspaceDetail.owner.identityIconUrl && (
                          <img
                            src={getDisplayIconUrl(currentWorkspaceDetail.owner.identityIconUrl)}
                            alt={currentWorkspaceDetail.owner.userName}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <p className="font-semibold truncate">{currentWorkspaceDetail.owner.userName}</p>
                      </div>
                    </div>
                  )}

                  {/* メンバー数 */}
                  <div>
                    <span className="text-xs text-base-content/70">メンバー数</span>
                    <p className="font-semibold flex items-center gap-2">
                      <PersonIcon className="w-4 h-4" />
                      {members.length}
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

                  {/* 更新日時 */}
                  {currentWorkspaceDetail.updatedAt && (
                    <div>
                      <span className="text-xs text-base-content/70">更新日時</span>
                      <p className="font-semibold">
                        {new Date(currentWorkspaceDetail.updatedAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  )}

                  {/* 更新者 */}
                  {currentWorkspaceDetail.updatedBy?.userName && (
                    <div>
                      <span className="text-xs text-base-content/70">更新者</span>
                      <div className="flex items-center gap-2 mt-1">
                        {currentWorkspaceDetail.updatedBy.identityIconUrl && (
                          <img
                            src={getDisplayIconUrl(currentWorkspaceDetail.updatedBy.identityIconUrl)}
                            alt={currentWorkspaceDetail.updatedBy.userName}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <p className="font-semibold truncate">{currentWorkspaceDetail.updatedBy.userName}</p>
                      </div>
                    </div>
                  )}
                </div>

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

          {/* アイテム詳細情報 */}
          {!showWorkspaceDetail && selectedItemId && (
            <WorkspaceItemDetail
              workspaceId={currentWorkspaceDetail.id}
              itemId={selectedItemId}
              onItemSelect={handleItemSelect}
              members={members}
              currentUserId={userInfo?.id}
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

        {/* アイテム一覧 (スマホ) */}
        <div className="lg:hidden flex-shrink-0 border-t border-base-300" style={{ height: '384px' }}>
          <WorkspaceItemsSidebar
            workspaceId={currentWorkspaceDetail.id}
            currentWorkspaceCode={workspaceCode}
            workspaces={currentWorkspaces}
            onHomeSelect={handleHomeSelect}
            onItemSelect={handleItemSelect}
            onCreateNew={handleCreateNew}
            scrollContainerId="itemsScrollableDiv-mobile"
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
          />
        </div>
      </div>
    </div>
  );
}
