# GenreListItemResponse

ジャンル一覧用レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ジャンルID | [optional] [default to undefined]
**name** | **string** | ジャンル名 | [default to undefined]
**description** | **string** | ジャンルの説明 | [optional] [default to undefined]
**icon** | **string** | ジャンルアイコン | [optional] [default to undefined]
**displayOrder** | **number** | 表示順 | [optional] [default to undefined]
**workspaceCount** | **number** | このジャンルを使用しているワークスペース数 | [optional] [default to undefined]
**isActive** | **boolean** | 有効フラグ | [optional] [default to undefined]

## Example

```typescript
import { GenreListItemResponse } from './api';

const instance: GenreListItemResponse = {
    id,
    name,
    description,
    icon,
    displayOrder,
    workspaceCount,
    isActive,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
