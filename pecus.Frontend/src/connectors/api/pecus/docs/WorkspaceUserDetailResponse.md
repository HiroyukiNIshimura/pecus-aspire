# WorkspaceUserDetailResponse

ワークスペースユーザー詳細レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**workspaceId** | **number** | ワークスペースID | [optional] [default to undefined]
**userId** | **number** | ユーザーID | [optional] [default to undefined]
**username** | **string** | ユーザー名 | [optional] [default to undefined]
**email** | **string** | メールアドレス | [optional] [default to undefined]
**workspaceRole** | **string** | ワークスペース内での役割 | [optional] [default to undefined]
**joinedAt** | **string** | 参加日時 | [optional] [default to undefined]
**lastAccessedAt** | **string** | 最終アクセス日時 | [optional] [default to undefined]
**isActive** | **boolean** | アクティブフラグ | [optional] [default to undefined]

## Example

```typescript
import { WorkspaceUserDetailResponse } from './api';

const instance: WorkspaceUserDetailResponse = {
    workspaceId,
    userId,
    username,
    email,
    workspaceRole,
    joinedAt,
    lastAccessedAt,
    isActive,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
