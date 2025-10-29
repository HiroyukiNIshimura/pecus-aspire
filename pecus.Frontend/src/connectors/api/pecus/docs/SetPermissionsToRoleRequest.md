# SetPermissionsToRoleRequest

ロールに権限を設定するリクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**permissionIds** | **Array&lt;number&gt;** | 設定する権限IDのリスト。既存の権限をすべて置き換えます。  空のリストまたはnullを指定するとすべての権限が削除されます。 | [optional] [default to undefined]

## Example

```typescript
import { SetPermissionsToRoleRequest } from './api';

const instance: SetPermissionsToRoleRequest = {
    permissionIds,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
