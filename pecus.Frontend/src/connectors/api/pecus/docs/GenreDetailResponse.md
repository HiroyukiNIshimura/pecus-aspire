# GenreDetailResponse

ジャンル詳細レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ジャンルID | [optional] [default to undefined]
**name** | **string** | ジャンル名 | [default to undefined]
**description** | **string** | ジャンルの説明 | [optional] [default to undefined]
**icon** | **string** | ジャンルアイコン | [optional] [default to undefined]
**displayOrder** | **number** | 表示順 | [optional] [default to undefined]
**workspaceCount** | **number** | このジャンルを使用しているワークスペース数 | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**createdByUserId** | **number** | 作成者ユーザーID | [optional] [default to undefined]
**updatedAt** | **string** | 更新日時 | [optional] [default to undefined]
**updatedByUserId** | **number** | 更新者ユーザーID | [optional] [default to undefined]
**isActive** | **boolean** | 有効フラグ | [optional] [default to undefined]

## Example

```typescript
import { GenreDetailResponse } from './api';

const instance: GenreDetailResponse = {
    id,
    name,
    description,
    icon,
    displayOrder,
    workspaceCount,
    createdAt,
    createdByUserId,
    updatedAt,
    updatedByUserId,
    isActive,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
