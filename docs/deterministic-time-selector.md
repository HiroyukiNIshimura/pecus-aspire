# 決定論的時刻ベースセレクター（Deterministic Time-based Selector）

## 概要

「スコープID + 時刻」のハッシュを使って、配列から要素を選択するパターン。
状態を保存せずに、時間経過で異なる要素が選ばれる。

## 特徴

- **決定論的**: 同じ入力なら同じ結果（デバッグしやすい）
- **ステートレス**: Redis やメモリ不要
- **スレッドセーフ**: 状態を持たないので競合なし
- **プロセス間共有不要**: 複数ワーカーでも一貫した結果

## ユースケース

| ケース | スコープ例 | 効果 |
|--------|----------|------|
| Bot の口調バリエーション | UserId | 同じユーザーでも時間で変わる |
| 通知メッセージのテンプレート | NotificationType | 同じ通知でも毎回微妙に違う表現 |
| ロードバランシング | RequestId | 複数サーバーに均等に散らす |
| A/Bテスト | UserId | ユーザーごとに一貫した振り分け |
| キャッシュのシャーディング | EntityId | 均等にキャッシュノードに分散 |

## 実装例

### C#

```csharp
public static class DeterministicSelector
{
    public static T Select<T>(T[] options, params object[] seeds)
    {
        if (options.Length == 0)
            throw new ArgumentException("options cannot be empty");

        var minutesSinceEpoch = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute;

        var hash = new HashCode();
        foreach (var seed in seeds)
            hash.Add(seed);
        hash.Add(minutesSinceEpoch);

        var index = Math.Abs(hash.ToHashCode()) % options.Length;
        return options[index];
    }
}

// 使用例
var perspectives = new[] { "完了率", "期限切れ", "進行中" };
var selected = DeterministicSelector.Select(perspectives, "WorkspaceHealth", workspaceId);
```

### TypeScript / JavaScript

```typescript
function selectByTime<T>(options: T[], ...seeds: unknown[]): T {
  if (options.length === 0) {
    throw new Error('options cannot be empty');
  }

  const minutes = Math.floor(Date.now() / 60000);
  const hash = cyrb53([...seeds, minutes].join(':'));
  return options[Math.abs(hash) % options.length];
}

// cyrb53: シンプルで高速なハッシュ関数
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// 使用例
const greetings = ['Hello', 'Hi', 'Hey', 'Yo'];
const message = selectByTime(greetings, userId, 'greeting');
```

### Python

```python
import hashlib
import time
from typing import TypeVar, Sequence

T = TypeVar('T')

def select_by_time(options: Sequence[T], *seeds) -> T:
    if not options:
        raise ValueError("options cannot be empty")

    minutes = int(time.time() // 60)
    seed_str = ':'.join(str(s) for s in [*seeds, minutes])
    hash_value = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)

    return options[hash_value % len(options)]

# 使用例
perspectives = ["完了率", "期限切れ", "進行中"]
selected = select_by_time(perspectives, "WorkspaceHealth", workspace_id)
```

## 時間粒度の調整

必要に応じて時間の粒度を変更可能：

```csharp
// 秒単位（頻繁に変わる）
var secondsSinceEpoch = DateTime.UtcNow.Ticks / TimeSpan.TicksPerSecond;

// 分単位（デフォルト）
var minutesSinceEpoch = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute;

// 時間単位（ゆっくり変わる）
var hoursSinceEpoch = DateTime.UtcNow.Ticks / TimeSpan.TicksPerHour;

// 日単位（1日固定）
var daysSinceEpoch = DateTime.UtcNow.Ticks / TimeSpan.TicksPerDay;
```

## プロジェクト内での使用

`pecus.Libs/Hangfire/Tasks/Bot/Behaviors/IPerspectiveRotator.cs` で実装済み。
Bot の健康状態コメント生成時に、異なる観点を選択するために使用。

## 注意事項

- 「前回と絶対に違う」保証はない（確率的にバラける）
- ハッシュの衝突により同じ値が連続する可能性はゼロではない
- 厳密な順序保証が必要な場合は、Redis 等で状態管理が必要
