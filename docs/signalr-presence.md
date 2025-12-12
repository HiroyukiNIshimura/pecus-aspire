# SignalR プレゼンス機能

## 概要

リアルタイムでユーザーのオンライン状態（プレゼンス）を表示する機能です。ワークスペース、組織、アイテムごとに「誰がオンラインか」を表示できます。

## 実装状況（2025-12-10）

- [x] Redis ベースのプレゼンス管理（`SignalRPresenceService`）
- [x] ワークスペースプレゼンス（`WorkspacePresence` コンポーネント）
- [x] 組織プレゼンス（`OrganizationPresence` コンポーネント）
- [x] アイテムプレゼンス（`ItemPresence` コンポーネント）
- [x] 参加時に既存ユーザー一覧を返す
- [x] 遊び心のあるアニメーション付き UI

---

## アーキテクチャ

### スケールアウト対応

複数サーバーインスタンスでの運用を考慮し、プレゼンス情報は **Redis（db2）** で管理します。

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend                                                        │
│ ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│ │ SignalRProvider │  │ Presence コンポーネント                  │
│ │ - joinWorkspace │  │ - WorkspacePresence                    │
│ │ - joinItem      │  │ - OrganizationPresence                 │
│ │ - onNotification│  │ - ItemPresence                         │
│ └─────────────────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend                                                         │
│ ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│ │ NotificationHub │  │ SignalRPresenceService                 │ │
│ │ - JoinWorkspace │──│ - RegisterConnectionAsync              │ │
│ │ - JoinItem      │  │ - AddConnectionToWorkspaceAsync        │ │
│ │ - LeaveItem     │  │ - RemoveConnectionFromWorkspaceAsync   │ │
│ │                 │  │ - GetWorkspaceUserIdsAsync             │ │
│ └─────────────────┘  └────────────────────────────────────────┘ │
│                                      │                          │
│                                      ▼                          │
│                          ┌────────────────────┐                 │
│                          │ Redis (db2)        │                 │
│                          │ プレゼンス情報保存   │                 │
│                          └────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Redis データベース構成

| DB | 用途 |
|----|------|
| db0 | セッション・トークン |
| db1 | Hangfire |
| db2 | SignalR プレゼンス |

---

## Redis キー設計

### 接続情報

| キー | 型 | 値 | TTL |
|------|----|----|-----|
| `presence:conn_user:{connectionId}` | String | `userId` | なし |
| `presence:conn_ws:{connectionId}` | String | `workspaceId` | なし |
| `presence:conn_item:{connectionId}` | String | `itemId` | なし |
| `presence:conn_org:{connectionId}` | String | `organizationId` | なし |

### グループメンバー

| キー | 型 | 値 | TTL |
|------|----|----|-----|
| `presence:ws_conns:{workspaceId}` | Set | connectionId の集合 | なし |
| `presence:item_conns:{itemId}` | Set | connectionId の集合 | なし |
| `presence:org_conns:{organizationId}` | Set | connectionId の集合 | なし |

### 編集状態

> 詳細は [item-edit-status.md](./item-edit-status.md) を参照

| キー | 型 | 値 | TTL | 用途 |
|------|----|----|-----|------|
| `presence:item_editor:{itemId}` | Hash | `{ userId, userName, identityIconUrl, connectionId }` | なし | アイテム編集中ユーザー |
| `presence:ws_editor:{workspaceId}` | Hash | `{ userId, userName, identityIconUrl, connectionId }` | なし | ワークスペース設定編集中ユーザー |
| `presence:task_editor:{taskId}` | Hash | `{ userId, userName, identityIconUrl, connectionId }` | なし | タスク編集中ユーザー |

---

## イベント

> イベント一覧は [signalr-implementation.md](./signalr-implementation.md#プレゼンス系hub-から送信) を参照

---

## Hub メソッド

### JoinWorkspace

```csharp
public async Task<List<WorkspacePresenceUser>> JoinWorkspace(int workspaceId)
```

- パラメータで `previousWorkspaceId` は不要（Redis で現在の状態を管理）
- 戻り値: 既に参加中のユーザー一覧

### JoinItem

```csharp
public async Task<List<ItemPresenceUser>> JoinItem(int itemId, int workspaceId)
```

- パラメータで `previousItemId`/`previousWorkspaceId` は不要
- ワークスペースにも同時参加
- 戻り値: 既にアイテムを閲覧中のユーザー一覧

### LeaveItem

```csharp
public async Task LeaveItem(int itemId)
```

- ワークスペースからは離脱しない

---

## フロントエンド実装

### SignalRProvider の型

```typescript
interface WorkspacePresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface OrganizationPresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface ItemPresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

// joinWorkspace は既存ユーザー一覧を返す
joinWorkspace: (workspaceId: number) => Promise<WorkspacePresenceUser[]>;

// joinItem は既存ユーザー一覧を返す
joinItem: (itemId: number, workspaceId: number) => Promise<ItemPresenceUser[]>;
```

### WorkspacePresence コンポーネント

```tsx
<WorkspacePresence
  workspaceId={workspaceId}
  currentUserId={currentUser.id}
  initialUsers={existingUsers}  // JoinWorkspace の戻り値
  maxVisible={5}
/>
```

画面右下に固定表示。フローティング・バブル形式でアニメーション付き。

### OrganizationPresence コンポーネント

```tsx
<OrganizationPresence
  organizationId={organizationId}
  currentUserId={currentUser.id}
  initialUsers={existingUsers}
  maxVisible={8}
/>
```

ヘッダーなどにコンパクトに表示。重なりスタイルのアバター一覧。

### ItemPresence コンポーネント

```tsx
// 通常表示
<ItemPresence
  itemId={itemId}
  currentUserId={currentUser.id}
  initialUsers={existingUsers}  // JoinItem の戻り値
/>

// コンパクト表示
<ItemPresence
  itemId={itemId}
  currentUserId={currentUser.id}
  initialUsers={existingUsers}
  compact
/>
```

「👁 N人が閲覧中」のラベル付き。

---

## UI デザイン

### アニメーション

| 状態 | アニメーション | 時間 |
|------|--------------|------|
| 入場 | `bubbleIn` - ポップアップ | 0.5s |
| 待機 | `float` - ふわふわ浮遊 | 3s (無限) |
| 退場 | `bubbleOut` - フェードアウト | 0.4s |

### CSS キーフレーム

```css
@keyframes bubbleIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bubbleOut {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

### ビジュアル要素

- **オンラインインジケーター**: 緑色のドット + pulse アニメーション
- **新規参加時のリング**: プライマリカラーの ping アニメーション
- **ホバーツールチップ**: ユーザー名を表示
- **オーバーフロー**: `+N` で隠れているユーザー数を表示

---

## SignalRPresenceService

### 主要メソッド

```csharp
public class SignalRPresenceService : ISignalRPresenceService
{
    // 接続登録（接続時に呼び出し）
    Task RegisterConnectionAsync(string connectionId, int userId);

    // ワークスペース関連
    Task AddConnectionToWorkspaceAsync(string connectionId, int workspaceId);
    Task RemoveConnectionFromWorkspaceAsync(string connectionId, int workspaceId);
    Task<List<int>> GetWorkspaceUserIdsAsync(int workspaceId);

    // 組織関連
    Task AddConnectionToOrganizationAsync(string connectionId, int organizationId);
    Task<List<int>> GetOrganizationUserIdsAsync(int organizationId);

    // アイテム関連
    Task AddConnectionToItemAsync(string connectionId, int itemId);
    Task RemoveConnectionFromItemAsync(string connectionId, int itemId);
    Task<List<int>> GetItemUserIdsAsync(int itemId);

    // 接続情報取得
    Task<int?> GetConnectionWorkspaceIdAsync(string connectionId);
    Task<int?> GetConnectionItemIdAsync(string connectionId);

    // 切断時のクリーンアップ
    Task UnregisterConnectionAsync(string connectionId);
}
```

---

## 注意事項

### React 19 Strict Mode 対応

Strict Mode では `useEffect` が2回実行されるため、以下の対策を実装：

```typescript
// 初期ユーザーの重複追加を防ぐ
const lastInitialUsersLengthRef = useRef(-1);

useEffect(() => {
  if (initialUsers.length === 0) return;
  if (lastInitialUsersLengthRef.current === initialUsers.length) return;
  lastInitialUsersLengthRef.current = initialUsers.length;
  // ...
}, [initialUsers]);
```

### 自分自身の除外

プレゼンス表示では自分自身を除外：

```typescript
const otherUsers = initialUsers.filter(u => u.userId !== currentUserId);
```

### 切断時の状態クリア

```typescript
useEffect(() => {
  if (connectionState === 'disconnected') {
    setPresenceUsers([]);
  }
}, [connectionState]);
```

---

## ファイル構成

### バックエンド

```
pecus.WebApi/
├── Hubs/
│   └── NotificationHub.cs          # プレゼンス通知を含む
└── Services/
    └── SignalRPresenceService.cs   # Redis プレゼンス管理
```

### フロントエンド

```
pecus.Frontend/src/
├── providers/
│   └── SignalRProvider.tsx         # プレゼンス型定義を含む
└── components/
    ├── workspaces/
    │   └── WorkspacePresence.tsx   # ワークスペースプレゼンス
    ├── organizations/
    │   └── OrganizationPresence.tsx # 組織プレゼンス
    └── items/
        └── ItemPresence.tsx        # アイテムプレゼンス
```

---

## 参考

- [SignalR 実装ガイド](./signalr-implementation.md) - 全体アーキテクチャ
- [Redis データベース分離](./redis-database-separation.md) - Redis DB 構成
