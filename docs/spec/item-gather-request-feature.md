# アイテムページへのメンバー召集機能 実装計画

## 概要
アイテム詳細ページから、ワークスペースのアクティブメンバーに対して「このページに集まって欲しい」というリアルタイム通知を送信し、メンバーが承諾すると該当のアイテムページに遷移する機能。

## ユースケース
- オンライン会議で司会者が特定のアイテムページを参加者と共有したい
- 編集中のユーザーの邪魔にならないように、控えめな通知として表示
- ユーザーは「はい」「いいえ」を選択でき、「はい」で該当ページに遷移

---

## 既存のSignalR実装の確認

### バックエンド
- **NotificationHub.cs** (`pecus.WebApi/Hubs/NotificationHub.cs`)
  - SignalRハブの実装、グループ管理とプレゼンス管理を担当
  - グループ構造: `organization:{id}`, `workspace:{id}`, `item:{id}`, `task:{id}`
  - プレゼンス情報はRedisで管理（SignalRPresenceService）

- **NotificationService.cs** (`pecus.WebApi/Services/NotificationService.cs`)
  - SignalRで通知を送信するヘルパーサービス
  - `SendToWorkspaceAsync`: ワークスペースの全メンバーに通知

### フロントエンド
- **SignalRProvider.tsx** (`pecus.Frontend/src/providers/SignalRProvider.tsx`)
  - SignalR接続の管理、通知の購読、グループ参加/離脱のAPIを提供
  - `onNotification`: 通知ハンドラーを登録
  - `joinWorkspace`, `leaveWorkspace` など

---

## 実装計画

### 1. バックエンド実装

#### 1.1 NotificationHub.cs に新しいメソッドを追加

**メソッド名**: `RequestItemGather`

**パラメータ**:
- `int workspaceId`: ワークスペースID
- `int itemId`: アイテムID

**処理フロー**:
1. ユーザー認証: ログイン中のユーザーIDを取得
2. 権限チェック: ワークスペースのアクティブメンバーかどうかを確認
3. アイテム情報を取得: アイテムコード、ワークスペースコード、件名、組織IDを取得
4. ワークスペースのアクティブメンバーIDリストを取得（クライアント側フィルタリング用）
5. 送信者情報を取得: ユーザー名、アイコンURLを取得
6. 組織グループにブロードキャスト:
   - 送信先: `organization:{organizationId}` グループ
   - 送信者自身を除外: `Clients.GroupExcept(groupName, Context.ConnectionId)`
   - クライアント側で `MemberIds` を使ってワークスペースメンバーかどうかをフィルタリング
   - イベント名: `item:gather_request`
   - ペイロード:
     ```csharp
     {
         WorkspaceId = workspaceId,
         ItemId = itemId,
         ItemCode = itemCode,
         WorkspaceCode = workspaceCode,
         ItemSubject = subject,
         SenderUserId = userId,
         SenderUserName = userName,
         SenderIdentityIconUrl = iconUrl,
         MemberIds = memberIds
     }
     ```

**実装例**:
```csharp
/// <summary>
/// アイテムページへのメンバー召集リクエストを送信する。
/// ワークスペースのアクティブメンバー（送信者を除く）に通知を送信する。
/// </summary>
/// <param name="workspaceId">ワークスペースID</param>
/// <param name="itemId">アイテムID</param>
public async Task RequestItemGather(int workspaceId, int itemId)
{
    if (workspaceId <= 0 || itemId <= 0)
    {
        throw new HubException("Invalid workspaceId or itemId");
    }

    var userId = GetUserId();
    if (userId == 0)
    {
        throw new HubException("Unauthorized");
    }

    // ワークスペースのアクティブメンバーかチェック
    var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(userId, workspaceId);
    if (!isMember)
    {
        _logger.LogDebug(
            "SignalR: User {UserId} is not a member of workspace {WorkspaceId}, skip item gather request",
            userId, workspaceId);
        return;
    }

    // レート制限チェック（連打対策）: アイテム単位で30秒以内に複数回送信できないようにする
    // ユーザーIDを含めないことで、複数人が同時に召集ボタンを押した場合も最初の1人のみ有効
    var rateLimitKey = $"gather_rate_limit:{itemId}";
    var lastGatherTime = await _presenceService.GetRateLimitAsync(rateLimitKey);
    var now = DateTimeOffset.UtcNow;
    if (lastGatherTime.HasValue && (now - lastGatherTime.Value).TotalSeconds < 30)
    {
        var remainingSeconds = 30 - (now - lastGatherTime.Value).TotalSeconds;
        _logger.LogDebug(
            "SignalR: Item {ItemId} is rate limited for gather request (remaining={RemainingSeconds}s)",
            itemId, remainingSeconds);
        // フロントエンドで判定しやすいよう RATE_LIMIT:秒数 のフォーマットでエラーを返す
        throw new HubException($"RATE_LIMIT:{remainingSeconds}");
    }

    // レート制限情報を更新（30秒のTTL）
    await _presenceService.SetRateLimitAsync(rateLimitKey, now, TimeSpan.FromSeconds(30));

    // アイテム情報を取得（組織IDも含む）
    var itemInfo = await _context.WorkspaceItems
        .Where(i => i.Id == itemId && i.WorkspaceId == workspaceId)
        .Select(i => new
        {
            i.Code,
            i.Subject,
            WorkspaceCode = i.Workspace.Code,
            OrganizationId = i.Workspace.OrganizationId
        })
        .FirstOrDefaultAsync();

    if (itemInfo == null)
    {
        _logger.LogWarning(
            "SignalR: Item {ItemId} not found in workspace {WorkspaceId}, skip gather request",
            itemId, workspaceId);
        return;
    }

    // ワークスペースのアクティブメンバーIDリストを取得（クライアント側でフィルタリング用）
    var memberIds = await _context.WorkspaceUsers
        .Where(wu => wu.WorkspaceId == workspaceId && wu.User.IsActive)
        .Select(wu => wu.UserId)
        .ToListAsync();

    // 送信者情報を取得
    var user = await _context.Users
        .Where(u => u.Id == userId && u.IsActive)
        .Select(u => new
        {
            u.Id,
            u.Username,
            u.Email,
            u.AvatarType,
            u.UserAvatarPath
        })
        .FirstOrDefaultAsync();

    if (user == null)
    {
        _logger.LogWarning("SignalR: User {UserId} not found when sending gather request", userId);
        return;
    }

    var identityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
        user.AvatarType,
        user.Id,
        user.Username,
        user.Email,
        user.UserAvatarPath);

    // 組織グループにブロードキャスト（送信者を除く）
    // クライアント側で MemberIds を使ってワークスペースメンバーかどうかをフィルタリング
    var groupName = $"organization:{itemInfo.OrganizationId}";
    await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
    {
        EventType = "item:gather_request",
        Payload = new
        {
            WorkspaceId = workspaceId,
            ItemId = itemId,
            ItemCode = itemInfo.Code,
            WorkspaceCode = itemInfo.WorkspaceCode,
            ItemSubject = itemInfo.Subject,
            SenderUserId = userId,
            SenderUserName = user.Username,
            SenderIdentityIconUrl = identityIconUrl,
            MemberIds = memberIds
        },
        Timestamp = DateTimeOffset.UtcNow
    });

    _logger.LogDebug(
        "SignalR: User {UserId} requested item gather for {ItemId} in workspace {WorkspaceId} (sent to organization:{OrganizationId})",
        userId, itemId, workspaceId, itemInfo.OrganizationId);
}
```

---

### 2. フロントエンド実装

#### 2.1 SignalRProvider.tsx に新しいメソッドを追加

**メソッド名**: `requestItemGather`

**実装箇所**: `SignalRContextValue` インターフェースと `SignalRProvider` コンポーネント

**実装例**:
```typescript
// SignalRContextValue インターフェースに追加
interface SignalRContextValue {
  // ... 既存のプロパティ ...

  /** アイテムページへのメンバー召集をリクエスト */
  requestItemGather: (workspaceId: number, itemId: number) => Promise<void>;
}

// SignalRProvider コンポーネント内に追加
const requestItemGather = useCallback(async (workspaceId: number, itemId: number) => {
  const connection = connectionRef.current;
  if (!connection || connection.state !== HubConnectionState.Connected) {
    console.warn('[SignalR] Cannot request item gather: not connected');
    return;
  }

  try {
    await connection.invoke('RequestItemGather', workspaceId, itemId);
    console.log(`[SignalR] Requested item gather: workspace=${workspaceId}, item=${itemId}`);
  } catch (error) {
    console.error('[SignalR] Failed to request item gather:', error);
  }
}, []);

// Context value に追加
const value = {
  // ... 既存のプロパティ ...
  requestItemGather,
};
```

#### 2.2 WorkspaceItemDetail.tsx に「メンバーを召集」ボタンを追加

**実装箇所**: アクションボタンエリア（PINボタン、タイムラインボタンの近く）

**連打対策**: クールダウン期間を設定し、短時間に複数回送信できないようにする

**実装例**:
```tsx
import { useSignalRContext } from '@/providers/SignalRProvider';

const WorkspaceItemDetail = forwardRef<WorkspaceItemDetailHandle, WorkspaceItemDetailProps>(
  function WorkspaceItemDetail(props, ref) {
    const { requestItemGather } = useSignalRContext();
    const [isGathering, setIsGathering] = useState(false);
    const [lastGatherTime, setLastGatherTime] = useState<number>(0);

    // クールダウン期間（ミリ秒）
    const GATHER_COOLDOWN_MS = 30000; // 30秒

    // メンバー召集ハンドラー（連打対策あり）
    const handleGatherRequest = async () => {
      if (!item) {
        return;
      }

      // クールダウン期間チェック
      const now = Date.now();
      const timeSinceLastGather = now - lastGatherTime;
      if (timeSinceLastGather < GATHER_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((GATHER_COOLDOWN_MS - timeSinceLastGather) / 1000);
        notify.info(`召集通知は${remainingSeconds}秒後に再度送信できます。`);
        return;
      }

      setIsGathering(true);
      try {
        await requestItemGather(workspaceId, itemId);
        setLastGatherTime(now);
        notify.success('メンバーに召集を通知しました。');
      } catch (error) {
        notify.error('召集の通知に失敗しました。');
      } finally {
        setIsGathering(false);
      }
    };

    return (
      <div className="card">
        <div className="card-body">
          {/* ... 既存のコード ... */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* ... 既存のボタン ... */}

            {/* メンバー召集ボタン */}
            <button
              type="button"
              onClick={handleGatherRequest}
              className="btn btn-secondary btn-sm gap-1"
              title="メンバーをこのページに召集"
              disabled={isGathering}
            >
              {isGathering ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <span className="icon-[mdi--account-multiple-plus] size-4" aria-hidden="true" />
              )}
              召集
            </button>
          </div>
          {/* ... 既存のコード ... */}
        </div>
      </div>
    );
  }
);
```

#### 2.3 レイアウトまたはProviderで通知を受信して表示

**実装箇所**: `pecus.Frontend/src/app/(workspace-full)/layout.tsx` または専用の通知コンポーネント

**通知の表示方法**:
- カスタムダイアログ（モーダル）として表示
- 「〇〇さんがこのページに集まって欲しいと通知しました」
- 「はい」「いいえ」ボタン
- 「はい」をクリックで該当ページに遷移
- 「いいえ」または×ボタンでダイアログを閉じる

**実装例** (`pecus.Frontend/src/components/notifications/ItemGatherNotification.tsx` を新規作成):
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import { useCurrentUserId } from '@/providers/AppSettingsProvider';
import { useSignalRContext, type SignalRNotification } from '@/providers/SignalRProvider';

interface GatherRequest {
  workspaceId: number;
  itemId: number;
  itemCode: string;
  workspaceCode: string;
  itemSubject: string | null;
  senderUserId: number;
  senderUserName: string;
  senderIdentityIconUrl: string | null;
  memberIds: number[];
}

/**
 * アイテムページへの召集通知を表示するコンポーネント
 */
export function ItemGatherNotification() {
  const router = useRouter();
  const { onNotification } = useSignalRContext();
  const currentUserId = useCurrentUserId();
  const [request, setRequest] = useState<GatherRequest | null>(null);

  useEffect(() => {
    const unsubscribe = onNotification((notification: SignalRNotification) => {
      if (notification.eventType === 'item:gather_request') {
        const payload = notification.payload as GatherRequest;

        // ワークスペースメンバーかどうかをフィルタリング
        if (!payload.memberIds || !payload.memberIds.includes(currentUserId)) {
          return;
        }

        // モーダル表示中は新規通知を無視（最初の召集に集中）
        setRequest((prevRequest) => {
          if (prevRequest) {
            return prevRequest;
          }
          return payload;
        });
      }
    });

    return unsubscribe;
  }, [onNotification, currentUserId]);

  const handleAccept = () => {
    if (!request) return;

    // アイテムページに遷移
    const url = `/workspaces/${request.workspaceCode}?itemCode=${request.itemCode}`;
    router.push(url);

    // ダイアログを閉じる
    setRequest(null);
  };

  const handleDecline = () => {
    setRequest(null);
  };

  if (!request) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-60" aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">ページ召集の通知</h3>
              <button
                type="button"
                onClick={handleDecline}
                className="btn btn-sm btn-circle btn-ghost"
                aria-label="閉じる"
              >
                <span className="icon-[mdi--close] size-5" aria-hidden="true" />
              </button>
            </div>

            {/* 送信者情報 */}
            <div className="mb-4">
              <UserAvatar
                userName={request.senderUserName}
                isActive={true}
                identityIconUrl={request.senderIdentityIconUrl}
                size={32}
                nameClassName="font-semibold"
              />
              <p className="mt-2 text-sm text-base-content/70">
                {request.senderUserName} さんがこのページに集まって欲しいと通知しました
              </p>
            </div>

            {/* アイテム情報 */}
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <p className="text-xs text-base-content/50 font-mono mb-1">
                #{request.itemCode}
              </p>
              <p className="font-semibold">
                {request.itemSubject || '（件名未設定）'}
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDecline}
                className="btn btn-secondary"
              >
                いいえ
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="btn btn-primary"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

**レイアウトに統合** (`pecus.Frontend/src/app/(workspace-full)/layout.tsx` および `pecus.Frontend/src/app/(dashboard)/layout.tsx`):

ワークスペースを開いていないユーザー（ダッシュボード画面など）にも通知が届くよう、複数のレイアウトにコンポーネントを配置:

```tsx
import { ItemGatherNotification } from '@/components/notifications/ItemGatherNotification';

// (workspace-full)/layout.tsx および (dashboard)/layout.tsx の両方に追加
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      {children}

      {/* アイテム召集通知 */}
      <ItemGatherNotification />
    </div>
  );
}
```

---

## 実装手順

### フェーズ1: バックエンド実装
1. `NotificationHub.cs` に `RequestItemGather` メソッドを追加
2. ビルド＆テスト

## 連打対策（レート制限）

### フロントエンド対策（ユーザー単位）
- **クールダウン期間**: 同じユーザーが同じアイテムに対して30秒以内に再送信できないようにする
- **ローカル状態管理**: `lastGatherTime` state で最後の送信時刻を記録
- **ユーザーフィードバック**: クールダウン中は残り秒数を表示して再送信可能までの時間を通知

### バックエンド対策（アイテム単位・グローバル）
- **Redisベースのレート制限**: `SignalRPresenceService` にレート制限機能を追加
  - キー: `gather_rate_limit:{itemId}` **（ユーザーIDを含めない）**
  - TTL: 30秒
  - **アイテム単位で30秒以内の再送信を拒否**
  - **複数人が同時に召集ボタンを押しても、最初の1人のみ有効**
- **エラーハンドリング**: レート制限に引っかかった場合、`HubException` をスローしてクライアントに通知
  - **エラーフォーマット**: `RATE_LIMIT:秒数` 形式で返し、フロントエンドで判定しやすくする
- **残り時間の通知**: フロントエンドでエラーメッセージをパースして残り秒数を表示

### SignalRPresenceService への追加メソッド例
```csharp
/// <summary>
/// レート制限情報を取得
/// </summary>
/// <param name="key">レート制限キー（例: gather_rate_limit:{itemId}）</param>
/// <returns>最後に実行した日時（UTC）、存在しない場合はnull</returns>
public async Task<DateTimeOffset?> GetRateLimitAsync(string key)
{
    var value = await _redis.GetDatabase().StringGetAsync(key);
    if (value.HasValue && DateTimeOffset.TryParse(value, out var timestamp))
    {
        return timestamp;
    }
    return null;
}

/// <summary>
/// レート制限情報を設定
/// </summary>
/// <param name="key">レート制限キー（例: gather_rate_limit:{itemId}）</param>
/// <param name="timestamp">実行日時（UTC）</param>
/// <param name="expiry">有効期限（TTL）</param>
public async Task SetRateLimitAsync(string key, DateTimeOffset timestamp, TimeSpan expiry)
{
    await _redis.GetDatabase().StringSetAsync(key, timestamp.ToString("O"), expiry);
}
```

### 受信者側の対策（モーダル表示中の制御）
- **最初の通知のみ表示**: モーダルが既に表示されている場合、新規通知を無視
  - `if (!request) { setRequest(payload); }` でチェック
  - 最初の召集に集中できる
  - 後続の通知スパムを防止
- **理由**: バックエンドでアイテム単位のレート制限があるため、複数の通知が来るケースは稀だが、タイミング次第で複数の通知が届く可能性があるため

### 同時召集シナリオへの対応

**シナリオ**: ユーザーA、B、Cがほぼ同時に召集ボタンをクリック

```
時刻 00:00 → ユーザーA、B、Cがほぼ同時にクリック

バックエンド側（アイテム単位のレート制限）:
├─ A: gather_rate_limit:{itemId} → OK（送信成功）
├─ B: gather_rate_limit:{itemId} → NG（レート制限エラー）
└─ C: gather_rate_limit:{itemId} → NG（レート制限エラー）

ユーザーB、Cの画面:
└─ 「このアイテムへの召集通知は ○ 秒後に送信できます。」と表示

受信者Dの画面:
└─ 通知A受信 → setRequest(A) ← Aさんのみ表示

結果: 最初にボタンを押したAさんの召集のみ有効
```

**メリット**:
- ✅ 通知スパムを完全に防止
- ✅ 受信者は1つの通知に集中できる
- ✅ サーバー負荷を軽減
- ✅ シンプルで理解しやすい

**トレードオフ**:
- ❌ 複数人が同時に「このページを共有したい」と思っても、最初の1人のみ実行可能
- ❌ 後から押したユーザーは30秒待つ必要がある
- ✅ ただし、このケースは稀で、むしろ混乱を防ぐ方が重要

---

## セキュリティとアクセス制御

- **ワークスペースメンバーシップ**: 送信者はワークスペースのアクティブメンバーである必要がある（Viewer権限でも送信可能）
- **権限チェック**: `OrganizationAccessHelper.IsActiveWorkspaceMemberAsync` で確認
- **送信者除外**: 送信者自身には通知を送らない（`Clients.GroupExcept`）
- **アクセス権限**: ワークスペースのメンバーであれば誰でも召集通知を送信できる（編集権限は不要）
- **レート制限**: アイテム単位で30秒以内に複数回送信できないようにする（連打対策・同時召集対策）

### フェーズ3: 結合テスト
1. 2つのブラウザを開いて同じワークスペースに参加
2. 片方のブラウザで「召集」ボタンをクリック
3. もう片方のブラウザで通知が表示されることを確認
4. 「はい」をクリックして該当ページに遷移することを確認

---

## セキュリティとアクセス制御

- **ワークスペースメンバーシップ**: 送信者はワークスペースのアクティブメンバーである必要がある（Viewer権限でも送信可能）
- **権限チェック**: `OrganizationAccessHelper.IsActiveWorkspaceMemberAsync` で確認
- **送信者除外**: 送信者自身には通知を送らない（`Clients.GroupExcept`）
- **アクセス権限**: ワークスペースのメンバーであれば誰でも召集通知を送信できる（編集権限は不要）

---

## 注意事項

- 通知はワークスペースに参加中（ページを開いている）のメンバーにのみ送信される
- SignalR接続が切断されている場合、通知は受信できない（永続的な通知ではない）
- ユーザーが「いいえ」を選択した場合、ログなどは記録しない（UX重視）
- アイテムがアーカイブされている場合も通知は送信される（ビューアー権限で閲覧可能なため）

---

## UI/UXの考慮事項

- **通知のタイミング**: リアルタイムでモーダルとして表示（邪魔にならないように中央に表示）
- **通知の優先度**: 編集中のユーザーに対しても表示するが、保存やキャンセルを促す内容ではない
- **通知の自動消去**: ユーザーが明示的に「はい」「いいえ」を選択するまで表示し続ける
- **複数通知**: 複数の召集リクエストが同時に来た場合、最新のものを表示（古いものは上書き）

---

## スケールアウト対応

### 現在の設計によるスケールアウト可能性

✅ **この方式はスケールアウトに対応しています**

#### SignalR Redisバックプレーン
- **既存実装**: `pecus.WebApi/Program.cs` で SignalR + Redis バックプレーンを設定済み
- **実装コード**:
  ```csharp
  .AddStackExchangeRedis(redisConnectionString, options =>
  {
      options.Configuration.ChannelPrefix = RedisChannel.Literal("coati-signalr");
  })
  ```
- **動作**: 複数のWebApiインスタンスが起動していても、Redisを経由してメッセージがすべてのサーバーに配信される

#### プレゼンス管理もRedisベース
- **SignalRPresenceService**: ユーザーのプレゼンス情報（誰がどのワークスペースにいるか）をRedisで管理
- **スケールアウト対応**: 複数サーバー間で状態を共有

#### スケールアウト時の動作フロー
1. ユーザーA（Server 1に接続）が「召集」ボタンをクリック
2. Server 1の`NotificationHub.RequestItemGather`が呼ばれる
3. `Clients.GroupExcept`でワークスペースグループにメッセージを送信
4. **Redisバックプレーンが他のサーバー（Server 2, 3...）にメッセージを配信**
5. 各サーバーに接続中のユーザーB, C, D...に通知が届く（ユーザーAは除外）

### メンバー数が多い場合の考慮事項

#### パフォーマンスへの影響
- **グループブロードキャスト**: `Clients.GroupExcept` はワークスペースグループ全員に配信
  - 100人規模: 問題なし
  - 1000人規模: Redisのパフォーマンス次第だが、通常は問題なし
  - 10000人規模: チャネルの最適化やメッセージサイズの圧縮を検討

#### 推奨事項
1. **Redisのモニタリング**: 通知送信時の Redis Pub/Sub の遅延を監視
2. **接続数の監視**: SignalR の同時接続数を監視（Azure SignalR Serviceへの移行も検討可能）
3. **メッセージサイズの最適化**: ペイロードに必要最小限のデータのみを含める（現在の設計は最適化済み）

#### さらなる最適化案（大規模運用時）
- **Azure SignalR Service**: 数万〜数十万の同時接続に対応
- **通知の間引き**: 短時間に複数回の召集通知が来た場合、クライアント側で最新のもののみ表示
- **通知対象の絞り込み**: 特定のメンバーのみに通知（将来の拡張案として記載済み）

### 結論
**現在の設計（SignalR + Redisバックプレーン）で、数百人規模のワークスペースでも問題なくスケールアウト可能です。**
さらに大規模な運用（数千人以上）が必要な場合は、Azure SignalR Serviceへの移行を検討してください。

---

## 将来の拡張案

- **通知履歴**: 過去の召集リクエストを履歴として記録
- **召集理由**: 送信者が理由やメッセージを追加できるようにする
- **召集対象の絞り込み**: 特定のメンバーのみに通知
- **通知の遅延送信**: 指定時刻に通知を送信
- **アプリ内通知センター**: 未読の召集リクエストを一覧表示
