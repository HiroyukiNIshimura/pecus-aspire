# CreateOrganizationRequest

組織登録リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | 組織名 | [default to undefined]
**phoneNumber** | **string** | 電話番号 | [default to undefined]
**code** | **string** | 組織コード | [optional] [default to undefined]
**description** | **string** | 組織の説明 | [optional] [default to undefined]
**representativeName** | **string** | 代表者名 | [optional] [default to undefined]
**email** | **string** | メールアドレス | [optional] [default to undefined]
**adminUsername** | **string** | 管理者ユーザー名 | [default to undefined]
**adminEmail** | **string** | 管理者メールアドレス | [default to undefined]
**adminPassword** | **string** | 管理者パスワード | [default to undefined]

## Example

```typescript
import { CreateOrganizationRequest } from './api';

const instance: CreateOrganizationRequest = {
    name,
    phoneNumber,
    code,
    description,
    representativeName,
    email,
    adminUsername,
    adminEmail,
    adminPassword,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
