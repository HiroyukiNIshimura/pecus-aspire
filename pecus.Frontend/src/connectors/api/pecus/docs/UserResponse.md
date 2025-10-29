# UserResponse

ユーザー情報レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ユーザーID | [optional] [default to undefined]
**loginId** | **string** | ログインID | [default to undefined]
**username** | **string** | ユーザー名 | [default to undefined]
**email** | **string** | メールアドレス | [default to undefined]
**avatarType** | **string** | アバタータイプ | [optional] [default to undefined]
**identityIconUrl** | **string** | アイデンティティアイコンURL | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]

## Example

```typescript
import { UserResponse } from './api';

const instance: UserResponse = {
    id,
    loginId,
    username,
    email,
    avatarType,
    identityIconUrl,
    createdAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
