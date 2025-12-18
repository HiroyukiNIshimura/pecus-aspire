# アイテム編集状態通知機能

## 概要

アイテムを誰かが編集中のとき、他のユーザーの編集ボタンや詳細画面をブロックしてUXを向上させる機能です。

## TODO

- [x] アイテム編集状態通知の実装
- [x] ワークスペース編集に同じ仕組みを流用
- [x] タスク編集に同じ仕組みを流用（新規 `task:{taskId}` グループ作成）

### なぜ必要か

DB層の排他制御（`DbUpdateConcurrencyException` → 409 Conflict）は既に実装済みですが、**後から編集していた人が保存時にコンフリクトで弾かれる**のは心理的ダメージが大きいです。

「最初から編集できない」と分かっていれば、同じ結果でもユーザーの気持ちは全く違います。

| 層 | 役割 | 実装 |
|---|------|------|
| DB層 | 排他制御（最終防衛） | 既存：`DbUpdateConcurrencyException` + 409 |
| UI層 | 編集中通知（UX向上） | **本機能**：SignalR で通知 |

---

## 設計方針

- **排他ロックではない**：UI のブロックのみ。最悪同時編集されても DB 層で弾く
- **シンプル**：チャットの「入力中...」と同じ仕組み
- **途中参加対応**：後からアイテムを開いた人にも現在の編集状態を通知

---

## フロー

### 1. 編集開始

```
┌────────────────────────────────────────────────────────────────┐
│ Aさんが編集画面を開く                                           │
├────────────────────────────────────────────────────────────────┤
│ 1. Hub.StartItemEdit(itemId) を SignalR 経由で呼び出し           │
│ 2. サーバー側で編集状態は保持せず、SignalRのリアルタイム通知のみ │
│ 3. SignalRグループに item:edit_started を Broadcast             │
│ 4. 戻り値: void                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2. グループ参加者への通知

```
┌────────────────────────────────────────────────────────────────┐
│ グループ参加者（Bさん）がSignalR経由で通知を受信                 │
├────────────────────────────────────────────────────────────────┤
│ 1. item:edit_started イベントを受信（SignalR）                  │
│ 2. UI で編集ボタンを非活性化                                    │
│ 3. 「Aさんが編集中」を表示                                      │
└────────────────────────────────────────────────────────────────┘
```

### 3. 途中参加者への通知

```
┌────────────────────────────────────────────────────────────────┐
│ Bさんが途中からアイテムを開く                                   │
├────────────────────────────────────────────────────────────────┤
│ 1. JoinItem(itemId) をSignalR経由で呼び出し（既存）             │
│ 2. GetItemEditStatus(itemId) をSignalR経由で呼び出し（新規）    │
│    └─ 戻り値: { isEditing, editor? }                           │
│ 3. isEditing = true なら編集ボタンを非活性化                    │
└────────────────────────────────────────────────────────────────┘
```

### 4. 編集終了

```
┌────────────────────────────────────────────────────────────────┐
│ Aさんが編集画面を閉じる                                         │
├────────────────────────────────────────────────────────────────┤
│ 1. Hub.EndItemEdit(itemId) をSignalR経由で呼び出し              │
│ 2. サーバー側で編集状態の保持や解除は行わず、SignalRの通知のみ │
│ 3. SignalRグループに item:edit_ended を Broadcast               │
│ 4. 参加者は編集ボタンを活性化                                   │
└────────────────────────────────────────────────────────────────┘
```

### 5. 切断時の自動解除

```
┌────────────────────────────────────────────────────────────────┐
│ Aさんがブラウザを閉じる / ネットワーク切断                       │
├────────────────────────────────────────────────────────────────┤
│ 1. OnDisconnectedAsync で編集状態を自動解除（SignalR）          │
│ 2. サーバー側で編集状態の解除等は行わず、SignalRの通知のみ       │
│ 3. SignalRグループに item:edit_ended を Broadcast               │
└────────────────────────────────────────────────────────────────┘
```

---



## サーバー側状態管理について

現在の実装は **Redis(db2) に編集状態を保持** し、接続IDとアイテム/ワークスペースを相互に引けるようにしています。

- 保存形式: Hash（`presence:item_editor:{itemId}` / `presence:ws_editor:{workspaceId}`）と connection → entity の String
- TTL: 24h（異常切断時のクリーンアップ用）
- OnDisconnected / グループ切替時に自動解除し、`item:edit_ended` / `workspace:edit_ended` をブロードキャスト

途中参加者への編集状態伝達は、保持している状態を `GetItemEditStatus` / `GetWorkspaceEditStatus` で返却しつつ、イベントも購読させるハイブリッド方式。

## イベント

> イベント一覧は [signalr-implementation.md](./signalr-implementation.md#編集状態通知系hub-から送信) を参照

---

## Hub メソッド

### StartItemEdit / StartWorkspaceEdit

```csharp
public async Task StartItemEdit(int itemId)
public async Task StartWorkspaceEdit(int workspaceId)
```

- サーバー側で編集状態を管理（Redis）
- SignalRグループに `item:edit_started` / `workspace:edit_started` を通知
- 同一ユーザーが別タブで既に編集中の場合は何もしない（UI側で判定）

### EndItemEdit / EndWorkspaceEdit

```csharp
public async Task EndItemEdit(int itemId)
public async Task EndWorkspaceEdit(int workspaceId)
```

- サーバー側で編集状態を解除（Redis）
- SignalRグループに `item:edit_ended` / `workspace:edit_ended` を通知

### GetItemEditStatus / GetWorkspaceEditStatus

```csharp
public async Task<ItemEditStatus?> GetItemEditStatus(int itemId)
public async Task<WorkspaceEditStatus?> GetWorkspaceEditStatus(int workspaceId)
```

- 戻り値: `{ isEditing: bool, editor?: { userId, userName, identityIconUrl } }`
- 途中参加者が現在の編集状態を取得するため（SignalR経由）

---

## SignalRPresenceService 追加メソッド

```csharp

// Redisでアイテム/ワークスペース編集状態を保持するメソッド群を実装済み
```

---

## フロントエンド実装

### SignalRProvider 追加メソッド

```typescript
interface ItemEditor {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface ItemEditStatus {
  isEditing: boolean;
  editor?: ItemEditor;
}

interface WorkspaceEditor {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface WorkspaceEditStatus {
  isEditing: boolean;
  editor?: WorkspaceEditor;
}

// 編集開始
startItemEdit: (itemId: number) => Promise<void>;
startWorkspaceEdit: (workspaceId: number) => Promise<void>;

// 編集終了
endItemEdit: (itemId: number) => Promise<void>;
endWorkspaceEdit: (workspaceId: number) => Promise<void>;

// 編集状態取得
getItemEditStatus: (itemId: number) => Promise<ItemEditStatus>;
getWorkspaceEditStatus: (workspaceId: number) => Promise<WorkspaceEditStatus>;
```

### イベントハンドラ

```typescript
// 編集開始通知
onItemEditStarted: (callback: (data: { itemId: number; userId: number; userName: string; identityIconUrl: string | null }) => void) => void;
onWorkspaceEditStarted: (callback: (data: { workspaceId: number; userId: number; userName: string; identityIconUrl: string | null }) => void) => void;

// 編集終了通知
onItemEditEnded: (callback: (data: { itemId: number; userId: number }) => void) => void;
onWorkspaceEditEnded: (callback: (data: { workspaceId: number; userId: number }) => void) => void;
```

### 使用例

```tsx
// アイテム詳細画面
function ItemDetail({ itemId }: { itemId: number }) {
  const { getItemEditStatus, startItemEdit, endItemEdit, onItemEditStarted, onItemEditEnded } = useSignalR();
  const [editStatus, setEditStatus] = useState<ItemEditStatus>({ isEditing: false });
  const currentUserId = useCurrentUserId();

  // 初期状態取得
  useEffect(() => {
    getItemEditStatus(itemId).then(setEditStatus);
  }, [itemId]);

  // リアルタイム通知
  useEffect(() => {
    onItemEditStarted((data) => {
      if (data.itemId === itemId) {
        setEditStatus({ isEditing: true, editor: data });
      }
    });

    onItemEditEnded((data) => {
      if (data.itemId === itemId) {
        setEditStatus({ isEditing: false });
      }
    });
  }, [itemId]);

  // 編集ボタン
  const canEdit = !editStatus.isEditing || editStatus.editor?.userId === currentUserId;

  return (
    <div>
      {editStatus.isEditing && editStatus.editor?.userId !== currentUserId && (
        <div className="alert alert-warning">
          {editStatus.editor?.userName} さんが編集中です
        </div>
      )}
      <button
        disabled={!canEdit}
        onClick={() => {
          startItemEdit(itemId);
          openEditModal();
        }}
      >
        編集
      </button>
    </div>
  );
}
```

### 編集モーダルでの使用

```tsx
function EditItemModal({ itemId, onClose }: { itemId: number; onClose: () => void }) {
  const { endItemEdit } = useSignalR();

  // モーダルを閉じるときに編集終了
  const handleClose = () => {
    endItemEdit(itemId);
    onClose();
  };

  // ブラウザを閉じた場合は OnDisconnectedAsync で自動解除

  return (
    <Modal onClose={handleClose}>
      {/* 編集フォーム */}
    </Modal>
  );
}
```

ワークスペース編集モーダルでも同様に `startWorkspaceEdit` / `endWorkspaceEdit` をモーダルの開閉に合わせて呼び出し、`WorkspaceEditStatus` コンポーネントでロック表示を行う。

---

## 同一ユーザーの複数タブ対応

同じユーザーが別タブで同じアイテムを開いている場合：

1. **最初のタブ**で編集開始 → 編集可能
2. **別タブ**で同じアイテムを開く → `getItemEditStatus` で自分が編集中と分かる
3. UI で「別タブで編集中です」と表示し、編集ボタンを非活性

```typescript
const isEditingInAnotherTab = editStatus.isEditing && editStatus.editor?.userId === currentUserId;

{isEditingInAnotherTab && (
  <div className="alert alert-info">
    別のタブで編集中です
  </div>
)}
```

---

## タスク編集の特殊な実装

### アイテム/ワークスペースとの違い

| 項目 | アイテム/ワークスペース | タスク |
|------|------------------------|--------|
| 詳細画面 | 閲覧専用 | **編集フォームがすでに表示** |
| 編集開始 | 「編集」ボタンを押す → モーダル | **詳細画面を開いた瞬間** |
| ロック取得タイミング | モーダルを開く時 | ページを開く時 |

### タスク詳細画面の設計

タスク詳細画面は「詳細画面 = 編集画面」という設計のため、以下の追加実装が必要：

1. **アトミックなロック取得**: `TrySetTaskEditorAsync`（Luaスクリプト）でレースコンディションを防止
2. **ページオープン時のロック取得**: `joinTask` → `startTaskEdit` を1つのフローで実行
3. **例外のスロー**: `startTaskEdit` が失敗時に例外をスローして呼び出し元で検知
4. **ロック解放時の自動取得**: 他ユーザーが `task:edit_ended` を受信したら、自動で `startTaskEdit` を試行

### フロー

```
┌────────────────────────────────────────────────────────────────┐
│ Aさんがタスク詳細画面を開く                                     │
├────────────────────────────────────────────────────────────────┤
│ 1. joinTask(taskId) → タスクグループに参加                      │
│ 2. startTaskEdit(taskId) → アトミックにロック取得を試行         │
│ 3. 成功 → 編集可能                                              │
│ 4. 失敗（HubException）→ getTaskEditStatus で現在の状態を取得   │
│    → 「他のユーザーが編集中」を表示、保存ボタン無効化           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Bさんがタスク詳細画面を開く（Aさんが編集中）                     │
├────────────────────────────────────────────────────────────────┤
│ 1. joinTask(taskId) → タスクグループに参加                      │
│ 2. startTaskEdit(taskId) → ロック取得失敗（Aさんがロック中）    │
│ 3. getTaskEditStatus → { isEditing: true, editor: A }          │
│ 4. 「Aさんが編集中」を表示、保存ボタン無効化                    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Aさんが画面を閉じる → Bさんが自動でロック取得                   │
├────────────────────────────────────────────────────────────────┤
│ 1. Aさん: endTaskEdit → task:edit_ended をブロードキャスト      │
│ 2. Bさん: task:edit_ended を受信                                │
│ 3. Bさん: startTaskEdit を自動で試行 → 成功                     │
│ 4. Bさん: 編集可能に                                            │
└────────────────────────────────────────────────────────────────┘
```

### 実装ファイル

```
pecus.WebApi/
├── Hubs/
│   └── NotificationHub.cs          # StartTaskEdit で TrySetTaskEditorAsync を使用
└── Services/
    └── SignalRPresenceService.cs   # TrySetTaskEditorAsync（Luaスクリプトでアトミック取得）

pecus.Frontend/src/
├── providers/
│   └── SignalRProvider.tsx         # startTaskEdit が例外をスロー
├── components/
│   └── workspaces/
│       └── TaskEditStatus.tsx      # タスク編集状態表示、イベント購読
└── app/(workspace-full)/workspaces/[code]/
    └── WorkspaceTaskDetailPage.tsx # handleStatusChange でロック解放時の自動取得
```

---

## 注意事項

### 編集終了の確実な呼び出し

編集画面を閉じるすべてのパスで `endItemEdit` を呼び出す：

- モーダルの閉じるボタン
- モーダル外クリック
- ESC キー
- 保存完了後

### 切断時の自動解除

`OnDisconnectedAsync` で編集状態も解除する：

```csharp
public override async Task OnDisconnectedAsync(Exception? exception)
{
    // 既存のプレゼンス解除処理
    // ...

    // 編集状態の解除を追加
    var editingItemId = await _presenceService.GetConnectionEditingItemIdAsync(connectionId);
    if (editingItemId.HasValue)
    {
        await _presenceService.RemoveItemEditorAsync(editingItemId.Value, connectionId);
        await Clients.Group($"item:{editingItemId.Value}")
            .SendAsync("Notification", new { type = "item:edit_ended", itemId = editingItemId.Value, userId });
    }

    await base.OnDisconnectedAsync(exception);
}
```

---

## ファイル構成

### バックエンド（変更）

```
pecus.WebApi/
├── Hubs/
│   └── NotificationHub.cs          # Start/End/Get Item & Workspace Edit 状態、切断時クリーンアップ
└── Services/
  └── SignalRPresenceService.cs   # アイテム/ワークスペース編集状態をRedisで管理
```

### フロントエンド（変更）

```
pecus.Frontend/src/
├── providers/
│   └── SignalRProvider.tsx         # Item/Workspace の start/end/get とイベント購読を提供
└── components/
  ├── items/
  │   └── ItemEditStatus.tsx          # アイテム編集状態表示
  └── workspaces/
    └── WorkspaceEditStatus.tsx     # ワークスペース編集状態表示
```

---

## 参考

- [SignalR プレゼンス機能](./signalr-presence.md) - プレゼンス全体設計
- [SignalR 実装ガイド](./signalr-implementation.md) - 全体アーキテクチャ
- [DB 同時実行制御](./db-concurrency.md) - DB 層の排他制御
