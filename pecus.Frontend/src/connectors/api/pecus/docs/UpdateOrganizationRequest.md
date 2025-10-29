# UpdateOrganizationRequest

組織更新リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | 組織名 | [optional] [default to undefined]
**code** | **string** | 組織コード | [optional] [default to undefined]
**description** | **string** | 組織の説明 | [optional] [default to undefined]
**representativeName** | **string** | 代表者名 | [optional] [default to undefined]
**phoneNumber** | **string** | 電話番号 | [optional] [default to undefined]
**email** | **string** | メールアドレス | [optional] [default to undefined]

## Example

```typescript
import { UpdateOrganizationRequest } from './api';

const instance: UpdateOrganizationRequest = {
    name,
    code,
    description,
    representativeName,
    phoneNumber,
    email,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
