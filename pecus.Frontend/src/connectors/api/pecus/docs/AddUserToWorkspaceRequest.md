# AddUserToWorkspaceRequest

ワークスペースにユーザーを参加させるリクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**userId** | **number** | 参加させるユーザーID | [default to undefined]
**workspaceRole** | **string** | ワークスペース内での役割（例: Owner, Member, Guest） | [optional] [default to undefined]

## Example

```typescript
import { AddUserToWorkspaceRequest } from './api';

const instance: AddUserToWorkspaceRequest = {
    userId,
    workspaceRole,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
