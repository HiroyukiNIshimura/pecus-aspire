# RoleDetailResponse

ロール詳細レスポンス（権限を含む）

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ロールID | [optional] [default to undefined]
**name** | **string** | ロール名 | [default to undefined]
**description** | **string** | ロールの説明 | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**permissions** | [**Array&lt;PermissionDetailInfoResponse&gt;**](PermissionDetailInfoResponse.md) | ロールが持つ権限一覧 | [optional] [default to undefined]

## Example

```typescript
import { RoleDetailResponse } from './api';

const instance: RoleDetailResponse = {
    id,
    name,
    description,
    createdAt,
    permissions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
