# GenreResponse

ジャンル基本レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ジャンルID | [optional] [default to undefined]
**name** | **string** | ジャンル名 | [default to undefined]
**description** | **string** | ジャンルの説明 | [optional] [default to undefined]
**icon** | **string** | ジャンルアイコン | [optional] [default to undefined]
**displayOrder** | **number** | 表示順 | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**updatedAt** | **string** | 更新日時 | [optional] [default to undefined]
**isActive** | **boolean** | 有効フラグ | [optional] [default to undefined]

## Example

```typescript
import { GenreResponse } from './api';

const instance: GenreResponse = {
    id,
    name,
    description,
    icon,
    displayOrder,
    createdAt,
    updatedAt,
    isActive,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
