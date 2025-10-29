# OrganizationListItemResponse

組織リスト項目レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | 組織ID | [optional] [default to undefined]
**name** | **string** | 組織名 | [default to undefined]
**code** | **string** | 組織コード | [optional] [default to undefined]
**representativeName** | **string** | 代表者名 | [optional] [default to undefined]
**phoneNumber** | **string** | 電話番号 | [default to undefined]
**email** | **string** | メールアドレス | [optional] [default to undefined]
**isActive** | **boolean** | アクティブフラグ | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**userCount** | **number** | 所属ユーザー数 | [optional] [default to undefined]

## Example

```typescript
import { OrganizationListItemResponse } from './api';

const instance: OrganizationListItemResponse = {
    id,
    name,
    code,
    representativeName,
    phoneNumber,
    email,
    isActive,
    createdAt,
    userCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
