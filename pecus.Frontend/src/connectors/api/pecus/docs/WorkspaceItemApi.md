# WorkspaceItemApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiWorkspacesWorkspaceIdItemsGet**](#apiworkspacesworkspaceiditemsget) | **GET** /api/workspaces/{workspaceId}/items | ワークスペースアイテム一覧取得|
|[**apiWorkspacesWorkspaceIdItemsItemIdDelete**](#apiworkspacesworkspaceiditemsitemiddelete) | **DELETE** /api/workspaces/{workspaceId}/items/{itemId} | ワークスペースアイテム削除|
|[**apiWorkspacesWorkspaceIdItemsItemIdGet**](#apiworkspacesworkspaceiditemsitemidget) | **GET** /api/workspaces/{workspaceId}/items/{itemId} | ワークスペースアイテム取得|
|[**apiWorkspacesWorkspaceIdItemsItemIdPatch**](#apiworkspacesworkspaceiditemsitemidpatch) | **PATCH** /api/workspaces/{workspaceId}/items/{itemId} | ワークスペースアイテム更新|
|[**apiWorkspacesWorkspaceIdItemsItemIdStatusPatch**](#apiworkspacesworkspaceiditemsitemidstatuspatch) | **PATCH** /api/workspaces/{workspaceId}/items/{itemId}/status | ワークスペースアイテムステータス更新|
|[**apiWorkspacesWorkspaceIdItemsPost**](#apiworkspacesworkspaceiditemspost) | **POST** /api/workspaces/{workspaceId}/items | ワークスペースアイテム作成|

# **apiWorkspacesWorkspaceIdItemsGet**
> WorkspaceItemDetailResponsePagedResponse apiWorkspacesWorkspaceIdItemsGet()


### Example

```typescript
import {
    WorkspaceItemApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemApi(configuration);

let workspaceId: number; // (default to undefined)
let page: number; // (optional) (default to undefined)
let isDraft: boolean; // (optional) (default to undefined)
let isArchived: boolean; // (optional) (default to undefined)
let assigneeId: number; // (optional) (default to undefined)
let priority: number; // (optional) (default to undefined)
let pinned: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsGet(
    workspaceId,
    page,
    isDraft,
    isArchived,
    assigneeId,
    priority,
    pinned
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] |  | defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to undefined|
| **isDraft** | [**boolean**] |  | (optional) defaults to undefined|
| **isArchived** | [**boolean**] |  | (optional) defaults to undefined|
| **assigneeId** | [**number**] |  | (optional) defaults to undefined|
| **priority** | [**number**] |  | (optional) defaults to undefined|
| **pinned** | [**boolean**] |  | (optional) defaults to undefined|


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
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdDelete**
> SuccessResponse apiWorkspacesWorkspaceIdItemsItemIdDelete()


### Example

```typescript
import {
    WorkspaceItemApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdDelete(
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
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdGet**
> WorkspaceItemDetailResponse apiWorkspacesWorkspaceIdItemsItemIdGet()


### Example

```typescript
import {
    WorkspaceItemApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdGet(
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

**WorkspaceItemDetailResponse**

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

# **apiWorkspacesWorkspaceIdItemsItemIdPatch**
> WorkspaceItemResponse apiWorkspacesWorkspaceIdItemsItemIdPatch()


### Example

```typescript
import {
    WorkspaceItemApi,
    Configuration,
    UpdateWorkspaceItemRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)
let updateWorkspaceItemRequest: UpdateWorkspaceItemRequest; // (optional)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdPatch(
    workspaceId,
    itemId,
    updateWorkspaceItemRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateWorkspaceItemRequest** | **UpdateWorkspaceItemRequest**|  | |
| **workspaceId** | [**number**] |  | defaults to undefined|
| **itemId** | [**number**] |  | defaults to undefined|


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

# **apiWorkspacesWorkspaceIdItemsItemIdStatusPatch**
> WorkspaceItemResponse apiWorkspacesWorkspaceIdItemsItemIdStatusPatch()


### Example

```typescript
import {
    WorkspaceItemApi,
    Configuration,
    UpdateWorkspaceItemStatusRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemApi(configuration);

let workspaceId: number; // (default to undefined)
let itemId: number; // (default to undefined)
let updateWorkspaceItemStatusRequest: UpdateWorkspaceItemStatusRequest; // (optional)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdStatusPatch(
    workspaceId,
    itemId,
    updateWorkspaceItemStatusRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateWorkspaceItemStatusRequest** | **UpdateWorkspaceItemStatusRequest**|  | |
| **workspaceId** | [**number**] |  | defaults to undefined|
| **itemId** | [**number**] |  | defaults to undefined|


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

# **apiWorkspacesWorkspaceIdItemsPost**
> WorkspaceItemResponse apiWorkspacesWorkspaceIdItemsPost()


### Example

```typescript
import {
    WorkspaceItemApi,
    Configuration,
    CreateWorkspaceItemRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemApi(configuration);

let workspaceId: number; // (default to undefined)
let createWorkspaceItemRequest: CreateWorkspaceItemRequest; // (optional)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsPost(
    workspaceId,
    createWorkspaceItemRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createWorkspaceItemRequest** | **CreateWorkspaceItemRequest**|  | |
| **workspaceId** | [**number**] |  | defaults to undefined|


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

