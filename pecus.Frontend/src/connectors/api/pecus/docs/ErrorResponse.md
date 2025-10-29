# ErrorResponse

エラーレスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**statusCode** | **number** | HTTPステータスコード | [optional] [default to undefined]
**message** | **string** | エラーメッセージ | [default to undefined]
**details** | **string** | エラー詳細（オプション） | [optional] [default to undefined]

## Example

```typescript
import { ErrorResponse } from './api';

const instance: ErrorResponse = {
    statusCode,
    message,
    details,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
