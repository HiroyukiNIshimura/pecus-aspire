# WorkspaceItemTagApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiWorkspacesWorkspaceIdItemsItemIdTagsPut**](#apiworkspacesworkspaceiditemsitemidtagsput) | **PUT** /api/workspaces/{workspaceId}/items/{itemId}/tags | ワークスペースアイテムのタグを一括設定|

# **apiWorkspacesWorkspaceIdItemsItemIdTagsPut**
> WorkspaceItemResponse apiWorkspacesWorkspaceIdItemsItemIdTagsPut()


### Example

```typescript
import {
    WorkspaceItemTagApi,
    Configuration,
    SetTagsToItemRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemTagApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)
let setTagsToItemRequest: SetTagsToItemRequest; //タグ一括設定リクエスト (optional)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdTagsPut(
    workspaceId,
    itemId,
    setTagsToItemRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setTagsToItemRequest** | **SetTagsToItemRequest**| タグ一括設定リクエスト | |
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|


### Return type

**WorkspaceItemResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

