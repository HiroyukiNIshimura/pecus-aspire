# WorkspaceItemRelationApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiWorkspacesWorkspaceIdItemsItemIdRelationsGet**](#apiworkspacesworkspaceiditemsitemidrelationsget) | **GET** /api/workspaces/{workspaceId}/items/{itemId}/relations | ワークスペースアイテムの関連一覧を取得|
|[**apiWorkspacesWorkspaceIdItemsItemIdRelationsPost**](#apiworkspacesworkspaceiditemsitemidrelationspost) | **POST** /api/workspaces/{workspaceId}/items/{itemId}/relations | ワークスペースアイテムに関連を追加|
|[**apiWorkspacesWorkspaceIdItemsItemIdRelationsRelationIdDelete**](#apiworkspacesworkspaceiditemsitemidrelationsrelationiddelete) | **DELETE** /api/workspaces/{workspaceId}/items/{itemId}/relations/{relationId} | ワークスペースアイテムの関連を削除|

# **apiWorkspacesWorkspaceIdItemsItemIdRelationsGet**
> WorkspaceItemRelationsResponse apiWorkspacesWorkspaceIdItemsItemIdRelationsGet()


### Example

```typescript
import {
    WorkspaceItemRelationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemRelationApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdRelationsGet(
    workspaceId,
    itemId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] |  | defaults to undefined|
| **itemId** | [**number**] |  | defaults to undefined|


### Return type

**WorkspaceItemRelationsResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdRelationsPost**
> AddWorkspaceItemRelationResponse apiWorkspacesWorkspaceIdItemsItemIdRelationsPost()


### Example

```typescript
import {
    WorkspaceItemRelationApi,
    Configuration,
    AddWorkspaceItemRelationRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemRelationApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)
let addWorkspaceItemRelationRequest: AddWorkspaceItemRelationRequest; // (optional)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdRelationsPost(
    workspaceId,
    itemId,
    addWorkspaceItemRelationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addWorkspaceItemRelationRequest** | **AddWorkspaceItemRelationRequest**|  | |
| **workspaceId** | [**number**] |  | defaults to undefined|
| **itemId** | [**number**] |  | defaults to undefined|


### Return type

**AddWorkspaceItemRelationResponse**

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

# **apiWorkspacesWorkspaceIdItemsItemIdRelationsRelationIdDelete**
> SuccessResponse apiWorkspacesWorkspaceIdItemsItemIdRelationsRelationIdDelete()


### Example

```typescript
import {
    WorkspaceItemRelationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemRelationApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)
let relationId: number; // (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdRelationsRelationIdDelete(
    workspaceId,
    itemId,
    relationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] |  | defaults to undefined|
| **itemId** | [**number**] |  | defaults to undefined|
| **relationId** | [**number**] |  | defaults to undefined|


### Return type

**SuccessResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

