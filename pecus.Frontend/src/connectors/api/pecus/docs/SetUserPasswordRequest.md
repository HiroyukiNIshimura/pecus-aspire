# SetUserPasswordRequest

ユーザーパスワード設定リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**token** | **string** | パスワード設定トークン（メールで送信されたもの） | [default to undefined]
**password** | **string** | 新しいパスワード | [default to undefined]

## Example

```typescript
import { SetUserPasswordRequest } from './api';

const instance: SetUserPasswordRequest = {
    token,
    password,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
