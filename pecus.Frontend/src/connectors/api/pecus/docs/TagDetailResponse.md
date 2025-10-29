# TagDetailResponse

タグ詳細レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | タグID | [optional] [default to undefined]
**organizationId** | **number** | 組織ID | [optional] [default to undefined]
**name** | **string** | タグ名 | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**createdByUserId** | **number** | 作成者ユーザーID | [optional] [default to undefined]
**createdByUsername** | **string** | 作成者ユーザー名 | [optional] [default to undefined]
**updatedAt** | **string** | 更新日時 | [optional] [default to undefined]
**itemCount** | **number** | このタグが付与されているアイテム数 | [optional] [default to undefined]

## Example

```typescript
import { TagDetailResponse } from './api';

const instance: TagDetailResponse = {
    id,
    organizationId,
    name,
    createdAt,
    createdByUserId,
    createdByUsername,
    updatedAt,
    itemCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
