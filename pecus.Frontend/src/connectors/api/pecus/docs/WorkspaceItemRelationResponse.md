# WorkspaceItemRelationResponse

ワークスペースアイテム関連情報レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | 関連ID | [optional] [default to undefined]
**fromItemId** | **number** | 関連元アイテムID | [optional] [default to undefined]
**fromItemCode** | **string** | 関連元アイテムコード | [optional] [default to undefined]
**fromItemSubject** | **string** | 関連元アイテム件名 | [optional] [default to undefined]
**toItemId** | **number** | 関連先アイテムID | [optional] [default to undefined]
**toItemCode** | **string** | 関連先アイテムコード | [optional] [default to undefined]
**toItemSubject** | **string** | 関連先アイテム件名 | [optional] [default to undefined]
**relationType** | **string** | 関連タイプ | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**createdByUserId** | **number** | 作成者ID | [optional] [default to undefined]
**createdByUsername** | **string** | 作成者ユーザー名 | [optional] [default to undefined]

## Example

```typescript
import { WorkspaceItemRelationResponse } from './api';

const instance: WorkspaceItemRelationResponse = {
    id,
    fromItemId,
    fromItemCode,
    fromItemSubject,
    toItemId,
    toItemCode,
    toItemSubject,
    relationType,
    createdAt,
    createdByUserId,
    createdByUsername,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
