# UserListItemResponse

ユーザーリスト項目レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ユーザーID | [optional] [default to undefined]
**loginId** | **string** | ログインID | [default to undefined]
**username** | **string** | ユーザー名 | [default to undefined]
**email** | **string** | メールアドレス | [default to undefined]
**avatarType** | **string** | アバタータイプ | [optional] [default to undefined]
**identityIconUrl** | **string** | アイデンティティアイコンURL | [optional] [default to undefined]
**isActive** | **boolean** | アクティブフラグ | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**lastLoginAt** | **string** | 最終ログイン日時 | [optional] [default to undefined]
**roleCount** | **number** | ユーザーが持つロール数 | [optional] [default to undefined]

## Example

```typescript
import { UserListItemResponse } from './api';

const instance: UserListItemResponse = {
    id,
    loginId,
    username,
    email,
    avatarType,
    identityIconUrl,
    isActive,
    createdAt,
    lastLoginAt,
    roleCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
