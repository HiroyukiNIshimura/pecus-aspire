# Server Actions

このディレクトリには Next.js Server Actions が含まれています。Server Actions は `'use server'` ディレクティブを使用してサーバー側で実行される関数です。

## 構成

```
actions/
├── types.ts                    # 共通型定義（ApiResponse<T>）
├── auth.ts                     # 認証関連（ログイン、ログアウト）
├── profile.ts                  # プロフィール関連（ユーザー情報取得・更新）
└── admin/                      # 管理者機能
    ├── organization.ts         # 組織管理
    ├── workspace.ts            # ワークスペース管理
    └── user.ts                 # ユーザー管理
```

## 設計方針

### 1. WebAPI のドメインに対応した構成

Server Actions はバックエンドの WebAPI コントローラ構成に対応しています：

- `auth.ts` → `Controllers/Entrance/EntranceAuthController.cs`
- `profile.ts` → `Controllers/Profile/ProfileController.cs`
- `admin/organization.ts` → `Controllers/Admin/AdminOrganizationController.cs`
- `admin/workspace.ts` → `Controllers/Admin/AdminWorkspaceController.cs`
- `admin/user.ts` → `Controllers/Admin/AdminUserController.cs`

### 2. 統一されたレスポンス型

すべての Server Actions は `ApiResponse<T>` 型を返します：

```typescript
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### 3. 認証管理（Middleware + Axios）

認証は Next.js Middleware と Axios インターセプターの2層で管理されています：

- **Middleware（SSR）**: ページアクセス前にトークンを検証・リフレッシュ
- **Axios（CSR）**: クライアントサイドの動的API呼び出し時にトークンを検証・リフレッシュ

詳細は [`docs/middleware-authentication.md`](../../docs/middleware-authentication.md) を参照してください。

### 4. エラーハンドリング

各 Server Action 内で try-catch を実装し、必ず `ApiResponse<T>` 型を返します：

```typescript
export async function getOrganization(): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.apiAdminOrganizationGet();
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to fetch organization:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch organization'
    };
  }
}
```

**重要**: Middlewareが認証を事前にチェックするため、Server Actions内で401エラーハンドリングは不要です。

## 使用例

### Server Component から呼び出す場合

```typescript
import { getOrganization } from '@/actions/admin/organization';

export default async function OrganizationPage() {
  const result = await getOrganization();

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  return <div>{result.data.name}</div>;
}
```

**注**: Middlewareが事前に認証チェックを行うため、401エラーは発生しません。

### Client Component から呼び出す場合

```typescript
'use client';

import { useState } from 'react';
import { getOrganization } from '@/actions/admin/organization';

export default function OrganizationClient() {
  const [data, setData] = useState(null);

  const handleClick = async () => {
    const result = await getOrganization();
    if (result.success) {
      setData(result.data);
    } else {
      console.error(result.error);
    }
  };

  return <button onClick={handleClick}>Load Organization</button>;
}
```

### Form Action として使用する場合

```typescript
'use client';

import { login } from '@/actions/auth';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await login({
      loginIdentifier: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      alert(result.error);
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## メリット

1. **レイヤー削減**: API Routes 不要（Server Component/Action → WebAPI の2層）
2. **型安全性**: TypeScript の恩恵をフル活用
3. **Cookie 操作**: Server Actions 内で直接 cookies() にアクセス可能
4. **保守性**: ドメインごとにファイル分割で見通しが良い
5. **SSR 対応**: Server Component から直接呼び出し可能
6. **自動認証**: Middlewareがトークン管理を担当、Server Actionsはシンプルに保てる

## 注意事項

- Server Actions は常にサーバー側で実行されます
- クライアント側の状態（useState、useContext など）にアクセスできません
- 大量のデータを返す場合はパフォーマンスに注意してください
- エラーハンドリングは必ず実装してください（セキュリティ上重要）
- 認証エラー（401）は Middleware が処理するため、Server Actions では考慮不要です

## 関連ドキュメント

- [Middleware認証アーキテクチャ](../../docs/middleware-authentication.md) - トークン管理の詳細設計
