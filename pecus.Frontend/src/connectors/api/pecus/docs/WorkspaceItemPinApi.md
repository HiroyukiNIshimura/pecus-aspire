# WorkspaceItemPinApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUsersMePinnedItemsGet**](#apiusersmepinneditemsget) | **GET** /api/users/me/pinned-items | ログインユーザーがPINしたアイテム一覧を取得|
|[**apiWorkspacesWorkspaceIdItemsItemIdPinDelete**](#apiworkspacesworkspaceiditemsitemidpindelete) | **DELETE** /api/workspaces/{workspaceId}/items/{itemId}/pin | ワークスペースアイテムからPINを削除|
|[**apiWorkspacesWorkspaceIdItemsItemIdPinPost**](#apiworkspacesworkspaceiditemsitemidpinpost) | **POST** /api/workspaces/{workspaceId}/items/{itemId}/pin | ワークスペースアイテムにPINを追加|

# **apiUsersMePinnedItemsGet**
> WorkspaceItemDetailResponsePagedResponse apiUsersMePinnedItemsGet()


### Example

```typescript
import {
    WorkspaceItemPinApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemPinApi(configuration);

let page: number; //ページ番号（1から開始） (optional) (default to undefined)

const { status, data } = await apiInstance.apiUsersMePinnedItemsGet(
    page
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] | ページ番号（1から開始） | (optional) defaults to undefined|


### Return type

**WorkspaceItemDetailResponsePagedResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdPinDelete**
> WorkspaceItemResponse apiWorkspacesWorkspaceIdItemsItemIdPinDelete()


### Example

```typescript
import {
    WorkspaceItemPinApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemPinApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdPinDelete(
    workspaceId,
    itemId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|


### Return type

**WorkspaceItemResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdPinPost**
> WorkspaceItemResponse apiWorkspacesWorkspaceIdItemsItemIdPinPost()


### Example

```typescript
import {
    WorkspaceItemPinApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemPinApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdPinPost(
    workspaceId,
    itemId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|


### Return type

**WorkspaceItemResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

