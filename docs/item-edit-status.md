# アイテム編集状態通知機能

## 概要

アイテムを誰かが編集中のとき、他のユーザーの編集ボタンを非活性にしてUXを向上させる機能です。

## TODO

- [ ] アイテム編集状態通知の実装
- [ ] ワークスペース編集に同じ仕組みを流用
- [ ] タスク編集に同じ仕組みを流用（新規 `task:{taskId}` グループ作成が必要）

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
│ 1. Hub.StartItemEdit(itemId) 呼び出し                          │
│ 2. Redis に編集状態を保存                                       │
│ 3. グループに item:edit_started を Publish                     │
│ 4. 戻り値: void                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2. グループ参加者への通知

```
┌────────────────────────────────────────────────────────────────┐
│ グループ参加者（Bさん）が通知を受信                              │
├────────────────────────────────────────────────────────────────┤
│ 1. item:edit_started を受信                                    │
│ 2. UI で編集ボタンを非活性化                                    │
│ 3. 「Aさんが編集中」を表示                                      │
└────────────────────────────────────────────────────────────────┘
```

### 3. 途中参加者への通知

```
┌────────────────────────────────────────────────────────────────┐
│ Bさんが途中からアイテムを開く                                   │
├────────────────────────────────────────────────────────────────┤
│ 1. JoinItem(itemId) 呼び出し（既存）                           │
│ 2. GetItemEditStatus(itemId) 呼び出し（新規）                  │
│    └─ 戻り値: { isEditing, editor? }                           │
│ 3. isEditing = true なら編集ボタンを非活性化                    │
└────────────────────────────────────────────────────────────────┘
```

### 4. 編集終了

```
┌────────────────────────────────────────────────────────────────┐
│ Aさんが編集画面を閉じる                                         │
├────────────────────────────────────────────────────────────────┤
│ 1. Hub.EndItemEdit(itemId) 呼び出し                            │
│ 2. Redis から編集状態を削除                                     │
│ 3. グループに item:edit_ended を Publish                       │
│ 4. 参加者は編集ボタンを活性化                                   │
└────────────────────────────────────────────────────────────────┘
```

### 5. 切断時の自動解除

```
┌────────────────────────────────────────────────────────────────┐
│ Aさんがブラウザを閉じる / ネットワーク切断                       │
├────────────────────────────────────────────────────────────────┤
│ 1. OnDisconnectedAsync で編集状態を自動解除                    │
│ 2. Redis から編集状態を削除                                     │
│ 3. グループに item:edit_ended を Publish                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Redis キー設計

> Redis キー一覧は [signalr-presence.md](./signalr-presence.md#編集状態) を参照

### 用途

- **途中参加者**が `GetItemEditStatus` で現在の編集状態を取得
- **切断時**に `connectionId` で自分が編集中だったアイテムを特定

---

## イベント

> イベント一覧は [signalr-implementation.md](./signalr-implementation.md#編集状態通知系hub-から送信) を参照

---

## Hub メソッド

### StartItemEdit

```csharp
public async Task StartItemEdit(int itemId)
```

- Redis に編集状態を保存
- グループに `item:edit_started` を通知
- 同一ユーザーが別タブで既に編集中の場合は何もしない（UI側で判定）

### EndItemEdit

```csharp
public async Task EndItemEdit(int itemId)
```

- Redis から編集状態を削除
- グループに `item:edit_ended` を通知

### GetItemEditStatus

```csharp
public async Task<ItemEditStatus?> GetItemEditStatus(int itemId)
```

- 戻り値: `{ isEditing: bool, editor?: { userId, userName, identityIconUrl } }`
- 途中参加者が現在の編集状態を取得するため

---

## SignalRPresenceService 追加メソッド

```csharp
// 編集状態の設定
Task SetItemEditorAsync(int itemId, int userId, string userName, string? identityIconUrl, string connectionId);

// 編集状態の解除
Task RemoveItemEditorAsync(int itemId, string connectionId);

// 編集状態の取得
Task<ItemEditor?> GetItemEditorAsync(int itemId);

// 接続が編集中のアイテムIDを取得（切断時のクリーンアップ用）
Task<int?> GetConnectionEditingItemIdAsync(string connectionId);
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

// 編集開始
startItemEdit: (itemId: number) => Promise<void>;

// 編集終了
endItemEdit: (itemId: number) => Promise<void>;

// 編集状態取得
getItemEditStatus: (itemId: number) => Promise<ItemEditStatus>;
```

### イベントハンドラ

```typescript
// 編集開始通知
onItemEditStarted: (callback: (data: { itemId: number; userId: number; userName: string; identityIconUrl: string | null }) => void) => void;

// 編集終了通知
onItemEditEnded: (callback: (data: { itemId: number; userId: number }) => void) => void;
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
│   └── NotificationHub.cs          # StartItemEdit, EndItemEdit, GetItemEditStatus 追加
└── Services/
    └── SignalRPresenceService.cs   # 編集状態管理メソッド追加
```

### フロントエンド（変更）

```
pecus.Frontend/src/
├── providers/
│   └── SignalRProvider.tsx         # startItemEdit, endItemEdit, getItemEditStatus 追加
└── components/
    └── items/
        └── ItemEditStatus.tsx      # 編集状態表示コンポーネント（新規）
```

---

## 参考

- [SignalR プレゼンス機能](./signalr-presence.md) - プレゼンス全体設計
- [SignalR 実装ガイド](./signalr-implementation.md) - 全体アーキテクチャ
- [DB 同時実行制御](./db-concurrency.md) - DB 層の排他制御
