# BackendPermissionApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBackendPermissionsCategoryCategoryGet**](#apibackendpermissionscategorycategoryget) | **GET** /api/backend/permissions/category/{category} | カテゴリで権限取得|
|[**apiBackendPermissionsGet**](#apibackendpermissionsget) | **GET** /api/backend/permissions | 全権限取得|
|[**apiBackendPermissionsIdDelete**](#apibackendpermissionsiddelete) | **DELETE** /api/backend/permissions/{id} | 権限削除|
|[**apiBackendPermissionsIdGet**](#apibackendpermissionsidget) | **GET** /api/backend/permissions/{id} | 権限取得|
|[**apiBackendPermissionsPost**](#apibackendpermissionspost) | **POST** /api/backend/permissions | 権限作成|

# **apiBackendPermissionsCategoryCategoryGet**
> Array<PermissionListItemResponse> apiBackendPermissionsCategoryCategoryGet()


### Example

```typescript
import {
    BackendPermissionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendPermissionApi(configuration);

let category: string; // (default to undefined)

const { status, data } = await apiInstance.apiBackendPermissionsCategoryCategoryGet(
    category
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **category** | [**string**] |  | defaults to undefined|


### Return type

**Array<PermissionListItemResponse>**

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

# **apiBackendPermissionsGet**
> Array<PermissionListItemResponse> apiBackendPermissionsGet()


### Example

```typescript
import {
    BackendPermissionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendPermissionApi(configuration);

const { status, data } = await apiInstance.apiBackendPermissionsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<PermissionListItemResponse>**

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

# **apiBackendPermissionsIdDelete**
> SuccessResponse apiBackendPermissionsIdDelete()


### Example

```typescript
import {
    BackendPermissionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendPermissionApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendPermissionsIdDelete(
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

# **apiBackendPermissionsIdGet**
> PermissionDetailResponse apiBackendPermissionsIdGet()


### Example

```typescript
import {
    BackendPermissionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendPermissionApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendPermissionsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**PermissionDetailResponse**

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

# **apiBackendPermissionsPost**
> PermissionResponse apiBackendPermissionsPost()


### Example

```typescript
import {
    BackendPermissionApi,
    Configuration,
    CreatePermissionRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendPermissionApi(configuration);

let createPermissionRequest: CreatePermissionRequest; // (optional)

const { status, data } = await apiInstance.apiBackendPermissionsPost(
    createPermissionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createPermissionRequest** | **CreatePermissionRequest**|  | |


### Return type

**PermissionResponse**

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

