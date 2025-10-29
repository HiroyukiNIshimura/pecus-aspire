# RefreshResponse

リフレッシュレスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accessToken** | **string** | JWTアクセストークン | [default to undefined]
**tokenType** | **string** | トークンタイプ（常に \&quot;Bearer\&quot;） | [optional] [default to undefined]
**expiresAt** | **string** | トークンの有効期限（UTC） | [optional] [default to undefined]
**expiresIn** | **number** | トークンの有効時間（秒） | [optional] [default to undefined]
**refreshToken** | **string** | リフレッシュトークン | [default to undefined]
**refreshExpiresAt** | **string** | リフレッシュトークンの有効期限（UTC） | [optional] [default to undefined]

## Example

```typescript
import { RefreshResponse } from './api';

const instance: RefreshResponse = {
    accessToken,
    tokenType,
    expiresAt,
    expiresIn,
    refreshToken,
    refreshExpiresAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
