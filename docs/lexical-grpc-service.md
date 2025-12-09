# Lexical gRPCサービス設計書

## 概要

LexicalエディタのノードデータをHTML、Markdown、プレーンテキストに変換するNode.js製gRPCマイクロサービス。

## ステータス

| 項目 | 状態 |
|------|------|
| 設計フェーズ | ✅ 完了 |
| 実装フェーズ | ⚪ 未着手 |

---

## 確定事項 ✅

### 技術スタック

| 項目 | 選択 | 理由 |
|------|------|------|
| **フレームワーク** | NestJS | 構造化されたDI、.NETプロジェクトとの一貫性 |
| **HTTPアダプター** | Fastify | Expressより2〜3倍高速、スキーマバリデーション対応 |
| **通信プロトコル** | gRPC | 双方向通信、型安全、高パフォーマンス |
| **言語** | TypeScript | Lexicalとの相性、型安全性 |
| **Linter/Formatter** | Biome | ESLintは使用しない（プロジェクト統一） |

### サービス機能

| 機能 | 説明 |
|------|------|
| **ToHtml** | Lexical JSON → HTML変換 |
| **ToMarkdown** | Lexical JSON → Markdown変換 |
| **ToPlainText** | Lexical JSON → プレーンテキスト変換 |

### 通信方向

- **双方向**: `pecus.WebApi` ↔ Node.js gRPCサービス

### Aspire統合

- `pecus.AppHost` から `AddNpmApp` で起動管理
- サービスディスカバリは環境変数経由

### カスタムノードの扱い

現在のノード定義: `pecus.Frontend/src/components/editor/nodes/`

**採用**: C案「ノード定義だけ抽出」

gRPCサービスで必要なのは **シリアライズ/デシリアライズ** のみ。
Reactコンポーネント・CSSは不要なため、軽量なヘッドレス用ノード定義を作成する。

| 必要なもの | 不要なもの |
|-----------|-----------|
| ノードのtype定義 | Reactコンポーネント |
| importJSON / exportJSON | decorate()の戻り値 |
| exportDOM() | CSS |

#### 対象ノード一覧（18種類）

| ノード | ソース |
|--------|--------|
| AutocompleteNode | カスタム |
| DateTimeNode | カスタム |
| EmojiNode | カスタム |
| EquationNode | カスタム |
| FigmaNode | カスタム |
| ImageNode | カスタム |
| KeywordNode | カスタム |
| LayoutContainerNode | カスタム |
| LayoutItemNode | カスタム |
| MentionNode | カスタム |
| PageBreakNode | カスタム |
| SpecialTextNode | カスタム |
| StickyNode | カスタム |
| TweetNode | カスタム |
| YouTubeNode | カスタム |
| CollapsibleContainerNode | プラグイン内 |
| CollapsibleContentNode | プラグイン内 |
| CollapsibleTitleNode | プラグイン内 |

※ `@lexical/*` パッケージのノード（HeadingNode, ListNode等）はそのまま使用

### Proto定義の配置場所

**採用**: `pecus.Protos/` を新規作成

| 理由 | 説明 |
|------|------|
| **言語中立** | .NET / Node.js どちらからも参照しやすい |
| **責務明確** | 「サービス間契約」専用ディレクトリ |
| **拡張性** | 将来の他gRPCサービス追加時も集約可能 |

```
pecus.Protos/
├── lexical/
│   └── lexical.proto
└── README.md
```

※ `pecus.ServiceDefaults` は .NET向け共通設定パッケージのため不適

### サービス名

**採用**: `pecus.LexicalConverterService`

### ネットワーク設定

| 設定 | 環境変数 | デフォルト値 |
|------|----------|-------------|
| gRPCポート | `GRPC_PORT` | （必須） |
| バインドアドレス | `GRPC_HOST` | `0.0.0.0` |

#### `.env` 例

```env
GRPC_PORT=5100
GRPC_HOST=0.0.0.0
```

#### `main.ts` での使用例

```typescript
const port = configService.get<number>('GRPC_PORT');
const host = configService.get<string>('GRPC_HOST') ?? '0.0.0.0';
await app.listen(port, host);
```

---

## 次のステップ

1. [x] Proto定義の作成（`pecus.Protos/lexical/lexical.proto`）✅
2. [x] NestJSプロジェクトの初期化（Biome設定含む）✅
3. [ ] ヘッドレス用ノード定義の作成
4. [ ] Aspire統合（`AppHost.cs`）
5. [ ] 変換ロジックの実装
6. [ ] テスト

---

## 参考: 想定ディレクトリ構成

```
pecus-aspire/
├── pecus.Protos/                         # 共有Proto定義（新規）
│   └── lexical/
│       └── lexical.proto
├── pecus.LexicalConverterService/        # Node.js gRPCサービス（新規）
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── biome.json                        # Biome設定（ESLint不使用）
│   ├── .env
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── lexical/
│   │   │   ├── lexical.module.ts
│   │   │   ├── lexical.controller.ts
│   │   │   ├── lexical.service.ts
│   │   │   └── nodes/                    # ヘッドレス用ノード定義
│   │   └── health/
│   │       └── health.controller.ts
│   └── proto/                            # Protoからの生成物
└── pecus.AppHost/
    └── AppHost.cs                        # LexicalConverterService追加
```

---

## ⚠️ 重要: C# ↔ Node.js 間の gRPC 型注意事項

C#とNode.js(JavaScript)間でgRPC通信する際、型のインピーダンスミスマッチに注意が必要。
**Proto定義作成時に必ず以下を考慮すること。**

### 1. 64ビット整数 (`int64`, `uint64`) は使用禁止

| 問題 | 説明 |
|------|------|
| **JavaScriptの限界** | `Number` は 53ビットまでしか正確に扱えない（`2^53 - 1`） |
| **grpc-js の挙動** | `int64` を string として返すことがあり、C#側と不整合 |

```protobuf
// ❌ NG
int64 big_number = 1;

// ✅ OK: string で定義
string big_number_str = 1;

// ✅ OK: 範囲が収まるなら int32
int32 small_number = 1;
```

### 2. Enum は必ず 0 番目を UNKNOWN/UNSPECIFIED に

```protobuf
enum Status {
  STATUS_UNSPECIFIED = 0;  // 必須！未設定時のデフォルト
  STATUS_ACTIVE = 1;
  STATUS_INACTIVE = 2;
}
```

| 注意 | 説明 |
|------|------|
| **Proto3仕様** | 未設定時は必ず `0` が返る（nullではない） |
| **命名規則** | `ENUM名_UNSPECIFIED` または `ENUM名_UNKNOWN` |

### 3. Optional フィールドは明示的に

```protobuf
// ❌ 暗黙的optional（未設定と空文字の区別不可）
string name = 1;

// ✅ 明示的optional（has_name で存在確認可能）
optional string name = 1;
```

### 4. 日付・時刻は Timestamp を使用

```protobuf
import "google/protobuf/timestamp.proto";

message Event {
  google.protobuf.Timestamp created_at = 1;
}
```

| 言語 | 変換先 |
|------|--------|
| C# | `DateTime` / `DateTimeOffset` |
| Node.js | `Date` オブジェクト（要変換） |

### 5. バイナリデータ (`bytes`)

```protobuf
message File {
  bytes content = 1;
}
```

| 言語 | 型 |
|------|-----|
| C# | `ByteString` / `byte[]` |
| Node.js | `Buffer` / `Uint8Array` |

※ JSONシリアライズ時は Base64 エンコードが必要

### 今回のProto定義

現在の定義は `string` と `bool` のみのため、**インピーダンスミスマッチの影響なし** ✅

---

## Proto定義（実装済み）

ファイル: `pecus.Protos/lexical/lexical.proto`

```protobuf
syntax = "proto3";

package pecus.lexical;

option csharp_namespace = "Pecus.Lexical.Grpc";

service LexicalConverter {
  // Lexical JSON → HTML
  rpc ToHtml(ConvertRequest) returns (ConvertResponse);

  // Lexical JSON → Markdown
  rpc ToMarkdown(ConvertRequest) returns (ConvertResponse);

  // Lexical JSON → PlainText
  rpc ToPlainText(ConvertRequest) returns (ConvertResponse);
}

message ConvertRequest {
  string lexical_json = 1;  // Lexical EditorState JSON
}

message ConvertResponse {
  bool success = 1;
  string result = 2;
  optional string error_message = 3;  // エラー時のみ
  int32 processing_time_ms = 4;       // 処理時間（ミリ秒）
}
```

---

## 関連ドキュメント

- [バックエンドガイドライン](./backend-guidelines.md)
- [フロントエンドガイドライン](./frontend-guidelines.md)

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-09 | 初版作成、技術スタック確定 |
| 2025-12-09 | カスタムノード共有方式をC案「ノード定義だけ抽出」に決定 |
| 2025-12-09 | Proto定義の配置場所を `pecus.Protos/` 新規作成に決定 |
| 2025-12-09 | サービス名 `pecus.LexicalConverterService`、ポート設定（環境変数）、Biome採用を決定。設計完了 |
| 2025-12-09 | C# ↔ Node.js 間の gRPC 型注意事項を追加 |
| 2025-12-09 | Proto定義を作成（`pecus.Protos/lexical/lexical.proto`）|
| 2025-12-09 | NestJSプロジェクト初期化完了（`pecus.LexicalConverterService`）|
