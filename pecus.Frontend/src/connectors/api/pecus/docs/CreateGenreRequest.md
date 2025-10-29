# CreateGenreRequest

ジャンル登録リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | ジャンル名 | [default to undefined]
**description** | **string** | ジャンルの説明 | [optional] [default to undefined]
**icon** | **string** | ジャンルアイコン | [optional] [default to undefined]
**displayOrder** | **number** | 表示順 | [optional] [default to undefined]

## Example

```typescript
import { CreateGenreRequest } from './api';

const instance: CreateGenreRequest = {
    name,
    description,
    icon,
    displayOrder,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
