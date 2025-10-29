# LoginResponse

ログインレスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accessToken** | **string** | JWTアクセストークン | [default to undefined]
**tokenType** | **string** | トークンタイプ（常に \&quot;Bearer\&quot;） | [optional] [default to undefined]
**expiresAt** | **string** | トークンの有効期限（UTC） | [optional] [default to undefined]
**expiresIn** | **number** | トークンの有効時間（秒） | [optional] [default to undefined]
**userId** | **number** | ユーザーID | [optional] [default to undefined]
**loginId** | **string** | ログインID | [default to undefined]
**username** | **string** | ユーザー名 | [default to undefined]
**email** | **string** | メールアドレス | [default to undefined]
**avatarType** | **string** | アバタータイプ | [optional] [default to undefined]
**identityIconUrl** | **string** | アイデンティティアイコンURL | [optional] [default to undefined]
**roles** | [**Array&lt;RoleInfoResponse&gt;**](RoleInfoResponse.md) | ユーザーが持つロール一覧 | [optional] [default to undefined]
**refreshToken** | **string** | リフレッシュトークン | [optional] [default to undefined]
**refreshExpiresAt** | **string** | リフレッシュトークンの有効期限（UTC） | [optional] [default to undefined]

## Example

```typescript
import { LoginResponse } from './api';

const instance: LoginResponse = {
    accessToken,
    tokenType,
    expiresAt,
    expiresIn,
    userId,
    loginId,
    username,
    email,
    avatarType,
    identityIconUrl,
    roles,
    refreshToken,
    refreshExpiresAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
