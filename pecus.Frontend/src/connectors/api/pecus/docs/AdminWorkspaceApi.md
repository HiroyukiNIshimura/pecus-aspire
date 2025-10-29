# AdminWorkspaceApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiAdminWorkspacesGet**](#apiadminworkspacesget) | **GET** /api/admin/workspaces | ワークスペース一覧取得（ページネーション）|
|[**apiAdminWorkspacesIdActivatePatch**](#apiadminworkspacesidactivatepatch) | **PATCH** /api/admin/workspaces/{id}/activate | ワークスペース有効化|
|[**apiAdminWorkspacesIdDeactivatePatch**](#apiadminworkspacesiddeactivatepatch) | **PATCH** /api/admin/workspaces/{id}/deactivate | ワークスペース無効化|
|[**apiAdminWorkspacesIdDelete**](#apiadminworkspacesiddelete) | **DELETE** /api/admin/workspaces/{id} | ワークスペース削除|
|[**apiAdminWorkspacesIdGet**](#apiadminworkspacesidget) | **GET** /api/admin/workspaces/{id} | ワークスペース情報取得|
|[**apiAdminWorkspacesIdPut**](#apiadminworkspacesidput) | **PUT** /api/admin/workspaces/{id} | ワークスペース更新|
|[**apiAdminWorkspacesIdUsersGet**](#apiadminworkspacesidusersget) | **GET** /api/admin/workspaces/{id}/users | ワークスペースのメンバー一覧取得（ページネーション）|
|[**apiAdminWorkspacesIdUsersPost**](#apiadminworkspacesiduserspost) | **POST** /api/admin/workspaces/{id}/users | ワークスペースにユーザーを参加させる|
|[**apiAdminWorkspacesIdUsersUserIdDelete**](#apiadminworkspacesidusersuseriddelete) | **DELETE** /api/admin/workspaces/{id}/users/{userId} | ワークスペースからユーザーを削除|
|[**apiAdminWorkspacesPost**](#apiadminworkspacespost) | **POST** /api/admin/workspaces | ワークスペース登録|

# **apiAdminWorkspacesGet**
> WorkspaceListItemResponsePagedResponse apiAdminWorkspacesGet()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let page: number; // (optional) (default to undefined)
let activeOnly: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesGet(
    page,
    activeOnly
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] |  | (optional) defaults to undefined|
| **activeOnly** | [**boolean**] |  | (optional) defaults to undefined|


### Return type

**WorkspaceListItemResponsePagedResponse**

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

# **apiAdminWorkspacesIdActivatePatch**
> SuccessResponse apiAdminWorkspacesIdActivatePatch()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesIdActivatePatch(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


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

# **apiAdminWorkspacesIdDeactivatePatch**
> SuccessResponse apiAdminWorkspacesIdDeactivatePatch()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesIdDeactivatePatch(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


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

# **apiAdminWorkspacesIdDelete**
> SuccessResponse apiAdminWorkspacesIdDelete()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


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

# **apiAdminWorkspacesIdGet**
> WorkspaceDetailResponse apiAdminWorkspacesIdGet()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**WorkspaceDetailResponse**

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

# **apiAdminWorkspacesIdPut**
> WorkspaceResponse apiAdminWorkspacesIdPut()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration,
    UpdateWorkspaceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)
let updateWorkspaceRequest: UpdateWorkspaceRequest; // (optional)

const { status, data } = await apiInstance.apiAdminWorkspacesIdPut(
    id,
    updateWorkspaceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateWorkspaceRequest** | **UpdateWorkspaceRequest**|  | |
| **id** | [**number**] |  | defaults to undefined|


### Return type

**WorkspaceResponse**

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

# **apiAdminWorkspacesIdUsersGet**
> WorkspaceUserDetailResponsePagedResponse apiAdminWorkspacesIdUsersGet()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; //ワークスペースID (default to undefined)
let page: number; // (optional) (default to undefined)
let activeOnly: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesIdUsersGet(
    id,
    page,
    activeOnly
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ワークスペースID | defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to undefined|
| **activeOnly** | [**boolean**] |  | (optional) defaults to undefined|


### Return type

**WorkspaceUserDetailResponsePagedResponse**

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

# **apiAdminWorkspacesIdUsersPost**
> WorkspaceUserResponse apiAdminWorkspacesIdUsersPost()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration,
    AddUserToWorkspaceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)
let addUserToWorkspaceRequest: AddUserToWorkspaceRequest; // (optional)

const { status, data } = await apiInstance.apiAdminWorkspacesIdUsersPost(
    id,
    addUserToWorkspaceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addUserToWorkspaceRequest** | **AddUserToWorkspaceRequest**|  | |
| **id** | [**number**] |  | defaults to undefined|


### Return type

**WorkspaceUserResponse**

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

# **apiAdminWorkspacesIdUsersUserIdDelete**
> SuccessResponse apiAdminWorkspacesIdUsersUserIdDelete()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let id: number; // (default to undefined)
let userId: number; // (default to undefined)

const { status, data } = await apiInstance.apiAdminWorkspacesIdUsersUserIdDelete(
    id,
    userId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|
| **userId** | [**number**] |  | defaults to undefined|


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

# **apiAdminWorkspacesPost**
> WorkspaceResponse apiAdminWorkspacesPost()


### Example

```typescript
import {
    AdminWorkspaceApi,
    Configuration,
    CreateWorkspaceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminWorkspaceApi(configuration);

let createWorkspaceRequest: CreateWorkspaceRequest; // (optional)

const { status, data } = await apiInstance.apiAdminWorkspacesPost(
    createWorkspaceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createWorkspaceRequest** | **CreateWorkspaceRequest**|  | |


### Return type

**WorkspaceResponse**

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

