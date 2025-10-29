# PermissionDetailResponse

権限詳細レスポンス（ロールを含む）

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | 権限ID | [optional] [default to undefined]
**name** | **string** | 権限名 | [default to undefined]
**description** | **string** | 権限の説明 | [optional] [default to undefined]
**category** | **string** | 権限カテゴリ | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**roles** | [**Array&lt;RoleInfoResponse&gt;**](RoleInfoResponse.md) | この権限を持つロール一覧 | [optional] [default to undefined]

## Example

```typescript
import { PermissionDetailResponse } from './api';

const instance: PermissionDetailResponse = {
    id,
    name,
    description,
    category,
    createdAt,
    roles,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
