# UpdateWorkspaceItemRequest

ワークスペースアイテム更新リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**subject** | **string** | 件名 | [optional] [default to undefined]
**body** | **string** | 本文（WYSIWYGのノードデータをJSON形式で保存） | [optional] [default to undefined]
**assigneeId** | **number** | 作業中のユーザーID（NULL可） | [optional] [default to undefined]
**priority** | **number** | 重要度（1: 低、2: 普通、3: 高） | [optional] [default to undefined]
**dueDate** | **string** | 期限日 | [optional] [default to undefined]

## Example

```typescript
import { UpdateWorkspaceItemRequest } from './api';

const instance: UpdateWorkspaceItemRequest = {
    subject,
    body,
    assigneeId,
    priority,
    dueDate,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
