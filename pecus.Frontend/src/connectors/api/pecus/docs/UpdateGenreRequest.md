# UpdateGenreRequest

ジャンル更新リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | ジャンル名 | [optional] [default to undefined]
**description** | **string** | ジャンルの説明 | [optional] [default to undefined]
**icon** | **string** | ジャンルアイコン | [optional] [default to undefined]
**displayOrder** | **number** | 表示順 | [optional] [default to undefined]

## Example

```typescript
import { UpdateGenreRequest } from './api';

const instance: UpdateGenreRequest = {
    name,
    description,
    icon,
    displayOrder,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
