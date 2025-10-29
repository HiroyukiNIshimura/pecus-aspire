# ResetPasswordRequest

パスワードリセット実行リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**token** | **string** | パスワードリセットトークン（メールで送信されたもの） | [default to undefined]
**password** | **string** | 新しいパスワード | [default to undefined]

## Example

```typescript
import { ResetPasswordRequest } from './api';

const instance: ResetPasswordRequest = {
    token,
    password,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
