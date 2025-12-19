import { create } from 'zustand';

/**
 * チャットタブの種類
 */
export type ChatTab = 'dm' | 'group' | 'system';

/**
 * カテゴリ別未読数
 */
interface UnreadCounts {
  total: number;
  dm: number;
  group: number;
  ai: number;
  system: number;
}

/**
 * チャット状態
 */
interface ChatState {
  // ドロワー開閉（PC用）
  isDrawerOpen: boolean;

  // 現在選択中のルームID
  selectedRoomId: number | null;

  // アクティブタブ
  activeTab: ChatTab;

  // 未読数
  unreadCounts: UnreadCounts;

  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  selectRoom: (roomId: number | null) => void;
  setActiveTab: (tab: ChatTab) => void;
  setUnreadCounts: (counts: UnreadCounts) => void;
  resetChat: () => void;
}

const initialUnreadCounts: UnreadCounts = {
  total: 0,
  dm: 0,
  group: 0,
  ai: 0,
  system: 0,
};

/**
 * チャット用 Zustand ストア
 */
export const useChatStore = create<ChatState>((set) => ({
  // 初期状態
  isDrawerOpen: false,
  selectedRoomId: null,
  activeTab: 'dm',
  unreadCounts: initialUnreadCounts,

  // Actions
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedRoomId: null }),
  toggleDrawer: () =>
    set((state) => ({
      isDrawerOpen: !state.isDrawerOpen,
      // 閉じる時はルーム選択をリセット
      selectedRoomId: state.isDrawerOpen ? null : state.selectedRoomId,
    })),

  selectRoom: (roomId) => set({ selectedRoomId: roomId }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setUnreadCounts: (counts) => set({ unreadCounts: counts }),

  resetChat: () =>
    set({
      isDrawerOpen: false,
      selectedRoomId: null,
      activeTab: 'dm',
      unreadCounts: initialUnreadCounts,
    }),
}));
