'use client';

import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addMemberToWorkspace, removeMemberFromWorkspace, updateMemberRoleInWorkspace } from '@/actions/workspace';
import AppHeader from '@/components/common/AppHeader';
import AddMemberModal from '@/components/workspaces/AddMemberModal';
import ChangeRoleModal from '@/components/workspaces/ChangeRoleModal';
import RemoveMemberModal from '@/components/workspaces/RemoveMemberModal';
import WorkspaceMemberList from '@/components/workspaces/WorkspaceMemberList';
import type {
  WorkspaceDetailUserResponse,
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponse,
  WorkspaceRole,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';
import CreateWorkspaceItem from './CreateWorkspaceItem';
import WorkspaceItemDetail from './WorkspaceItemDetail';
import type { WorkspaceItemsSidebarHandle } from './WorkspaceItemsSidebar';
import WorkspaceItemsSidebar from './WorkspaceItemsSidebar';

interface WorkspaceDetailClientProps {
  workspaceCode: string;
  workspaceDetail: WorkspaceFullDetailResponse;
  workspaces: WorkspaceListItemResponse[];
  userInfo: UserInfo | null;
}

export default function WorkspaceDetailClient({
  workspaceCode,
  workspaceDetail,
  workspaces,
  userInfo,
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

  // ===== メンバー管理の状態 =====
  // ログインユーザーがOwnerかどうか
  const isOwner = workspaceDetail.currentUserRole === 'Owner';

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

  // サイドバー幅（初期値: 256px、クライアントサイドでローカルストレージから復元）
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // クライアントサイドでローカルストレージから幅を復元
  useEffect(() => {
    const saved = localStorage.getItem('workspaceSidebarWidth');
    if (saved) {
      const width = parseInt(saved, 10);
      if (!Number.isNaN(width) && width >= 200 && width <= 600) {
        setSidebarWidth(width);
      }
    }
  }, []);

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
          {workspaceDetail.genreIcon && (
            <img
              src={`/icons/genres/${workspaceDetail.genreIcon}.svg`}
              alt={workspaceDetail.genreName || 'ジャンルアイコン'}
              className="w-8 h-8 flex-shrink-0"
            />
          )}
          <span>{workspaceDetail.name}</span>
        </h2>
        {workspaceDetail.code && (
          <code className="text-sm badge badge-ghost badge-md mt-2 truncate max-w-full block">
            {workspaceDetail.code}
          </code>
        )}
      </div>
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
        <div
          ref={sidebarRef}
          className="hidden lg:block h-full overflow-hidden relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          <WorkspaceItemsSidebar
            ref={sidebarComponentRef}
            workspaceId={workspaceDetail.id}
            currentWorkspaceCode={workspaceCode}
            workspaces={workspaces}
            onHomeSelect={handleHomeSelect}
            onItemSelect={handleItemSelect}
            onCreateNew={handleCreateNew}
            scrollContainerId="itemsScrollableDiv-desktop"
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
                {workspaceDetail.description && (
                  <p className="text-base text-base-content/70 mb-4 whitespace-pre-wrap break-words">
                    {workspaceDetail.description}
                  </p>
                )}

                {/* メタ情報（4列） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 py-4 border-y border-base-300 text-sm">
                  {/* ステータス */}
                  <div>
                    <span className="text-xs text-base-content/70">ステータス</span>
                    <p className="font-semibold">{workspaceDetail.isActive ? 'アクティブ' : '非アクティブ'}</p>
                  </div>

                  {/* 作成日時 */}
                  {workspaceDetail.createdAt && (
                    <div>
                      <span className="text-xs text-base-content/70">作成日時</span>
                      <p className="font-semibold">{new Date(workspaceDetail.createdAt).toLocaleString('ja-JP')}</p>
                    </div>
                  )}

                  {/* オーナー */}
                  {workspaceDetail.owner?.userName && (
                    <div>
                      <span className="text-xs text-base-content/70">オーナー</span>
                      <div className="flex items-center gap-2 mt-1">
                        {workspaceDetail.owner.identityIconUrl && (
                          <img
                            src={getDisplayIconUrl(workspaceDetail.owner.identityIconUrl)}
                            alt={workspaceDetail.owner.userName}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <p className="font-semibold truncate">{workspaceDetail.owner.userName}</p>
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
                  {workspaceDetail.genreName && (
                    <div>
                      <span className="text-xs text-base-content/70">ジャンル</span>
                      <p className="font-semibold flex items-center gap-2">
                        {workspaceDetail.genreIcon && <span className="text-xl">{workspaceDetail.genreIcon}</span>}
                        {workspaceDetail.genreName}
                      </p>
                    </div>
                  )}

                  {/* 更新日時 */}
                  {workspaceDetail.updatedAt && (
                    <div>
                      <span className="text-xs text-base-content/70">更新日時</span>
                      <p className="font-semibold">{new Date(workspaceDetail.updatedAt).toLocaleString('ja-JP')}</p>
                    </div>
                  )}

                  {/* 更新者 */}
                  {workspaceDetail.updatedBy?.userName && (
                    <div>
                      <span className="text-xs text-base-content/70">更新者</span>
                      <div className="flex items-center gap-2 mt-1">
                        {workspaceDetail.updatedBy.identityIconUrl && (
                          <img
                            src={getDisplayIconUrl(workspaceDetail.updatedBy.identityIconUrl)}
                            alt={workspaceDetail.updatedBy.userName}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <p className="font-semibold truncate">{workspaceDetail.updatedBy.userName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* メンバー一覧 - WorkspaceMemberList コンポーネントを使用 */}
                <div className="mt-4">
                  <WorkspaceMemberList
                    members={members}
                    editable={isOwner}
                    ownerId={workspaceDetail.owner?.id}
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
              workspaceId={workspaceDetail.id}
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
          workspaceId={workspaceDetail.id}
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onCreate={handleCreateComplete}
        />

        {/* アイテム一覧 (スマホ) */}
        <div className="lg:hidden flex-shrink-0 border-t border-base-300" style={{ height: '384px' }}>
          <WorkspaceItemsSidebar
            workspaceId={workspaceDetail.id}
            currentWorkspaceCode={workspaceCode}
            workspaces={workspaces}
            onHomeSelect={handleHomeSelect}
            onItemSelect={handleItemSelect}
            onCreateNew={handleCreateNew}
            scrollContainerId="itemsScrollableDiv-mobile"
          />
        </div>
      </div>
    </div>
  );
}
