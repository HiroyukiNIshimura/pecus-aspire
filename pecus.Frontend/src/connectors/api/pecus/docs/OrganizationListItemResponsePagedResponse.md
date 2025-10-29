# OrganizationListItemResponsePagedResponse

ページネーション付きレスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**data** | [**Array&lt;OrganizationListItemResponse&gt;**](OrganizationListItemResponse.md) | データのリスト | [default to undefined]
**currentPage** | **number** | 現在のページ番号（1から始まる） | [optional] [default to undefined]
**pageSize** | **number** | 1ページあたりのアイテム数 | [optional] [default to undefined]
**totalCount** | **number** | 総アイテム数 | [optional] [default to undefined]
**totalPages** | **number** | 総ページ数 | [optional] [default to undefined]
**hasPreviousPage** | **boolean** | 前のページが存在するか | [optional] [default to undefined]
**hasNextPage** | **boolean** | 次のページが存在するか | [optional] [default to undefined]

## Example

```typescript
import { OrganizationListItemResponsePagedResponse } from './api';

const instance: OrganizationListItemResponsePagedResponse = {
    data,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage,
    hasNextPage,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
