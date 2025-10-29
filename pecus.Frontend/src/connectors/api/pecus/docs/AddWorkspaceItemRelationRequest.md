# AddWorkspaceItemRelationRequest

ワークスペースアイテム関連追加リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**toItemId** | **number** | 関連先アイテムID | [default to undefined]
**relationType** | **string** | 関連タイプ（オプション）  指定可能な値: \&quot;related\&quot;, \&quot;blocks\&quot;, \&quot;blocked_by\&quot;, \&quot;depends_on\&quot;, \&quot;duplicates\&quot;, \&quot;subtask_of\&quot;, \&quot;parent_of\&quot;, \&quot;relates_to\&quot; | [optional] [default to undefined]

## Example

```typescript
import { AddWorkspaceItemRelationRequest } from './api';

const instance: AddWorkspaceItemRelationRequest = {
    toItemId,
    relationType,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
