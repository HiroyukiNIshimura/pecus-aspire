# RoleListItemResponse

ロールリスト項目レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ロールID | [optional] [default to undefined]
**name** | **string** | ロール名 | [default to undefined]
**description** | **string** | ロールの説明 | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**permissionCount** | **number** | ロールが持つ権限数 | [optional] [default to undefined]

## Example

```typescript
import { RoleListItemResponse } from './api';

const instance: RoleListItemResponse = {
    id,
    name,
    description,
    createdAt,
    permissionCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
