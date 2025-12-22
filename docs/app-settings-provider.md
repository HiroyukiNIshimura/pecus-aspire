# AppSettingsProvider - アプリ全体設定の提供

## AI エージェント向け要約（必読）

- **目的**: 組織設定・ユーザー設定をアプリ全体で共有するための仕組み
- **セキュリティ**: APIキーなどの機密情報は含まない（`AppPublicSettingsResponse` を使用）
- **パターン**: SSR でレイアウト層で取得 → Context Provider で子コンポーネントに配布
- **主要 Hook**:
  - `useIsAiEnabled()` - AI 機能の有効/無効を判定
  - `useOrganizationSettings()` - 組織設定を取得
  - `useUserSettings()` - ユーザー設定を取得
- **禁止事項**: 各コンポーネントで個別に設定 API を呼び出さない（レイアウトで一括取得）

---

## 概要

`AppSettingsProvider` は、組織設定やユーザー設定をアプリ全体で効率的に共有するための React Context です。

### 解決する課題

1. **重複取得の排除**: 各コンポーネントが個別に設定を取得する非効率を解消
2. **一貫性の確保**: 同一リクエスト内で設定値が一貫していることを保証
3. **セキュリティ**: APIキー等の機密情報をフロントエンドに露出しない

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│  Layout (Server Component)                              │
│  └─ fetchAppSettings() で設定を取得                      │
│     └─ AppSettingsProvider (Client Component)           │
│        └─ 子コンポーネントに Context で配布              │
│           ├─ useIsAiEnabled()                           │
│           ├─ useOrganizationSettings()                  │
│           └─ useUserSettings()                          │
└─────────────────────────────────────────────────────────┘
```

### データフロー

1. **レイアウト層（SSR）**: `fetchAppSettings()` を呼び出し
2. **API エンドポイント**: `GET /api/profile/app-settings` が設定を返却
3. **Context Provider**: `AppSettingsProvider` が子コンポーネントに値を配布
4. **消費側**: Hook を使って必要な設定にアクセス

---

## 使用方法

### 1. レイアウトでの設定取得（既に設定済み）

すべての認証済みレイアウト（dashboard, workspace-full, profile, admin-full）で設定取得が実装済みです。

```tsx
// src/app/(dashboard)/layout.tsx の例
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
import { fetchAppSettings } from '@/actions/profile';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 設定を取得（エラー時はデフォルト値を使用）
  let appSettings = defaultAppSettings;
  try {
    const result = await fetchAppSettings();
    if (result.success && result.data) {
      appSettings = result.data;
    }
  } catch {
    // デフォルト値を使用
  }

  return (
    <AppSettingsProvider settings={appSettings}>
      {/* 他のプロバイダー */}
      {children}
    </AppSettingsProvider>
  );
}
```

### 2. コンポーネントでの設定利用

#### AI 機能の有効/無効判定

```tsx
'use client';

import { useIsAiEnabled } from '@/providers/AppSettingsProvider';

export function MyComponent() {
  const isAiEnabled = useIsAiEnabled();

  return (
    <div>
      {isAiEnabled && (
        <button>AI で提案</button>
      )}
    </div>
  );
}
```

#### 組織設定の取得

```tsx
'use client';

import { useOrganizationSettings } from '@/providers/AppSettingsProvider';

export function OrganizationInfo() {
  const { name, plan, aiProvider, isAiConfigured } = useOrganizationSettings();

  return (
    <div>
      <p>組織名: {name}</p>
      <p>プラン: {plan}</p>
      <p>AI プロバイダー: {aiProvider}</p>
      <p>AI 設定済み: {isAiConfigured ? 'はい' : 'いいえ'}</p>
    </div>
  );
}
```

#### ユーザー設定の取得

```tsx
'use client';

import { useUserSettings } from '@/providers/AppSettingsProvider';

export function UserPreferences() {
  const { timeZone, language, darkMode, emailNotifications } = useUserSettings();

  return (
    <div>
      <p>タイムゾーン: {timeZone}</p>
      <p>言語: {language}</p>
      <p>ダークモード: {darkMode ? 'ON' : 'OFF'}</p>
    </div>
  );
}
```

#### すべての設定を取得

```tsx
'use client';

import { useAppSettings } from '@/providers/AppSettingsProvider';

export function DebugSettings() {
  const { organization, user } = useAppSettings();

  console.log('Organization:', organization);
  console.log('User:', user);

  return <div>...</div>;
}
```

---

## 再利用可能コンポーネント

### AiSuggestButton

AI 提案ボタンのための再利用可能コンポーネントです。AI が無効な場合は自動的に非表示になります。

```tsx
import { AiSuggestButton } from '@/components/common/forms/AiSuggestButton';

export function MyForm() {
  const handleAiSuggest = async () => {
    // AI 提案ロジック
  };

  return (
    <form>
      <input type="text" />
      <AiSuggestButton
        onClick={handleAiSuggest}
        isLoading={false}
        disabled={false}
        className="ml-2"
      />
    </form>
  );
}
```

**Props:**
| Prop | 型 | 必須 | 説明 |
|------|------|------|------|
| `onClick` | `() => void` | ✅ | クリック時のハンドラー |
| `isLoading` | `boolean` | ❌ | ローディング状態 |
| `disabled` | `boolean` | ❌ | 無効状態 |
| `className` | `string` | ❌ | 追加の CSS クラス |

---

## 提供される設定値

### OrganizationPublicSettings

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `name` | `string` | 組織名 |
| `aiProvider` | `string` | AI プロバイダー（'None', 'OpenAI', 'Azure', 'Gemini'） |
| `isAiConfigured` | `boolean` | AI が正しく設定されているか |
| `plan` | `string` | 契約プラン |
| `trialEndsAt` | `string \| null` | トライアル終了日 |
| `createdAt` | `string` | 組織作成日 |

### UserPublicSettings

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `timeZone` | `string` | タイムゾーン |
| `language` | `string` | 言語設定 |
| `darkMode` | `boolean` | ダークモード有効 |
| `emailNotifications` | `boolean` | メール通知有効 |
| `pushNotifications` | `boolean` | プッシュ通知有効 |

---

## デフォルト値

Context Provider 外で Hook を使用した場合や、設定取得に失敗した場合のデフォルト値：

```typescript
export const defaultAppSettings: AppPublicSettings = {
  organization: {
    name: '',
    aiProvider: 'None',
    isAiConfigured: false,
    plan: 'Free',
    trialEndsAt: null,
    createdAt: new Date().toISOString(),
  },
  user: {
    timeZone: 'Asia/Tokyo',
    language: 'ja',
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
  },
};
```

---

## API エンドポイント

### GET /api/profile/app-settings

認証済みユーザーの組織設定とユーザー設定を取得します。

**レスポンス例:**
```json
{
  "organization": {
    "name": "Example Corp",
    "aiProvider": "OpenAI",
    "isAiConfigured": true,
    "plan": "Pro",
    "trialEndsAt": null,
    "createdAt": "2024-01-15T00:00:00Z"
  },
  "user": {
    "timeZone": "Asia/Tokyo",
    "language": "ja",
    "darkMode": false,
    "emailNotifications": true,
    "pushNotifications": true
  }
}
```

---

## 注意事項

### セキュリティ

- **機密情報は含まれません**: `GenerativeApiKey` などの API キーは `AppPublicSettingsResponse` に含まれていません
- サーバーサイドで取得し、クライアントに安全に渡します

### パフォーマンス

- レイアウト層で一度だけ取得するため、子コンポーネントでの重複リクエストが発生しません
- SSR で取得するため、初期表示時に設定が利用可能です

### エラーハンドリング

- 設定取得に失敗した場合は `defaultAppSettings` が使用されます
- AI 機能はデフォルトで無効（`isAiConfigured: false`）になるため、安全側に倒れます

---

## 関連ファイル

- `src/providers/AppSettingsProvider.tsx` - Context Provider と Hook の定義
- `src/actions/profile.ts` - `fetchAppSettings()` Server Action
- `src/components/common/forms/AiSuggestButton.tsx` - AI 提案ボタンコンポーネント
- `pecus.WebApi/Controllers/Profile/ProfileController.cs` - API エンドポイント
- `pecus.WebApi/Models/Responses/Common/AppPublicSettingsResponse.cs` - レスポンス DTO
