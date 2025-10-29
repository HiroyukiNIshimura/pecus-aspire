# WorkspaceItemRelationsResponse

ワークスペースアイテム関連一覧レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**relationsFrom** | [**Array&lt;WorkspaceItemRelationResponse&gt;**](WorkspaceItemRelationResponse.md) | 関連元としての関連一覧（このアイテムから他へ） | [optional] [default to undefined]
**relationsTo** | [**Array&lt;WorkspaceItemRelationResponse&gt;**](WorkspaceItemRelationResponse.md) | 関連先としての関連一覧（他からこのアイテムへ） | [optional] [default to undefined]
**totalCount** | **number** | 全関連数 | [optional] [default to undefined]

## Example

```typescript
import { WorkspaceItemRelationsResponse } from './api';

const instance: WorkspaceItemRelationsResponse = {
    relationsFrom,
    relationsTo,
    totalCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
