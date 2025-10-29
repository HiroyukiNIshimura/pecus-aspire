# BackendRoleApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBackendRolesGet**](#apibackendrolesget) | **GET** /api/backend/roles | 全ロール取得|
|[**apiBackendRolesIdDelete**](#apibackendrolesiddelete) | **DELETE** /api/backend/roles/{id} | ロール削除|
|[**apiBackendRolesIdGet**](#apibackendrolesidget) | **GET** /api/backend/roles/{id} | ロール取得|
|[**apiBackendRolesPost**](#apibackendrolespost) | **POST** /api/backend/roles | ロール作成|
|[**apiBackendRolesRoleIdPermissionsPut**](#apibackendrolesroleidpermissionsput) | **PUT** /api/backend/roles/{roleId}/permissions | ロールに権限を設定（既存の権限を置き換える）|

# **apiBackendRolesGet**
> Array<RoleListItemResponse> apiBackendRolesGet()


### Example

```typescript
import {
    BackendRoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendRoleApi(configuration);

const { status, data } = await apiInstance.apiBackendRolesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<RoleListItemResponse>**

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

# **apiBackendRolesIdDelete**
> SuccessResponse apiBackendRolesIdDelete()


### Example

```typescript
import {
    BackendRoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendRoleApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendRolesIdDelete(
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

# **apiBackendRolesIdGet**
> RoleDetailResponse apiBackendRolesIdGet()


### Example

```typescript
import {
    BackendRoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendRoleApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendRolesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**RoleDetailResponse**

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

# **apiBackendRolesPost**
> RoleResponse apiBackendRolesPost()


### Example

```typescript
import {
    BackendRoleApi,
    Configuration,
    CreateRoleRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendRoleApi(configuration);

let createRoleRequest: CreateRoleRequest; // (optional)

const { status, data } = await apiInstance.apiBackendRolesPost(
    createRoleRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createRoleRequest** | **CreateRoleRequest**|  | |


### Return type

**RoleResponse**

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
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendRolesRoleIdPermissionsPut**
> RoleDetailResponse apiBackendRolesRoleIdPermissionsPut()


### Example

```typescript
import {
    BackendRoleApi,
    Configuration,
    SetPermissionsToRoleRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendRoleApi(configuration);

let roleId: number; // (default to undefined)
let setPermissionsToRoleRequest: SetPermissionsToRoleRequest; // (optional)

const { status, data } = await apiInstance.apiBackendRolesRoleIdPermissionsPut(
    roleId,
    setPermissionsToRoleRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setPermissionsToRoleRequest** | **SetPermissionsToRoleRequest**|  | |
| **roleId** | [**number**] |  | defaults to undefined|


### Return type

**RoleDetailResponse**

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

