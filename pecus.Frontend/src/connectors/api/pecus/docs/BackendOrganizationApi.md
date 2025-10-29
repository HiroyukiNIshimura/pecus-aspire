# BackendOrganizationApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBackendOrganizationsGet**](#apibackendorganizationsget) | **GET** /api/backend/organizations | 組織一覧取得（ページネーション対応）|
|[**apiBackendOrganizationsIdActiveStatusPut**](#apibackendorganizationsidactivestatusput) | **PUT** /api/backend/organizations/{id}/active-status | 組織のアクティブ状態を設定|
|[**apiBackendOrganizationsIdDelete**](#apibackendorganizationsiddelete) | **DELETE** /api/backend/organizations/{id} | 組織削除|
|[**apiBackendOrganizationsIdGet**](#apibackendorganizationsidget) | **GET** /api/backend/organizations/{id} | 組織情報取得|
|[**apiBackendOrganizationsIdPut**](#apibackendorganizationsidput) | **PUT** /api/backend/organizations/{id} | 組織更新|
|[**apiBackendOrganizationsIdUsersGet**](#apibackendorganizationsidusersget) | **GET** /api/backend/organizations/{id}/users | 組織の所属ユーザー取得|

# **apiBackendOrganizationsGet**
> OrganizationListItemResponsePagedResponse apiBackendOrganizationsGet()


### Example

```typescript
import {
    BackendOrganizationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendOrganizationApi(configuration);

let page: number; // (optional) (default to undefined)
let activeOnly: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiBackendOrganizationsGet(
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

**OrganizationListItemResponsePagedResponse**

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

# **apiBackendOrganizationsIdActiveStatusPut**
> SuccessResponse apiBackendOrganizationsIdActiveStatusPut()


### Example

```typescript
import {
    BackendOrganizationApi,
    Configuration,
    SetActiveStatusRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendOrganizationApi(configuration);

let id: number; //組織ID (default to undefined)
let setActiveStatusRequest: SetActiveStatusRequest; //アクティブ状態設定リクエスト (optional)

const { status, data } = await apiInstance.apiBackendOrganizationsIdActiveStatusPut(
    id,
    setActiveStatusRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setActiveStatusRequest** | **SetActiveStatusRequest**| アクティブ状態設定リクエスト | |
| **id** | [**number**] | 組織ID | defaults to undefined|


### Return type

**SuccessResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendOrganizationsIdDelete**
> SuccessResponse apiBackendOrganizationsIdDelete()


### Example

```typescript
import {
    BackendOrganizationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendOrganizationApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendOrganizationsIdDelete(
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
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendOrganizationsIdGet**
> OrganizationDetailResponse apiBackendOrganizationsIdGet()


### Example

```typescript
import {
    BackendOrganizationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendOrganizationApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendOrganizationsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**OrganizationDetailResponse**

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

# **apiBackendOrganizationsIdPut**
> OrganizationResponse apiBackendOrganizationsIdPut()


### Example

```typescript
import {
    BackendOrganizationApi,
    Configuration,
    UpdateOrganizationRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendOrganizationApi(configuration);

let id: number; // (default to undefined)
let updateOrganizationRequest: UpdateOrganizationRequest; // (optional)

const { status, data } = await apiInstance.apiBackendOrganizationsIdPut(
    id,
    updateOrganizationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateOrganizationRequest** | **UpdateOrganizationRequest**|  | |
| **id** | [**number**] |  | defaults to undefined|


### Return type

**OrganizationResponse**

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

# **apiBackendOrganizationsIdUsersGet**
> Array<UserListItemResponse> apiBackendOrganizationsIdUsersGet()


### Example

```typescript
import {
    BackendOrganizationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendOrganizationApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiBackendOrganizationsIdUsersGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**Array<UserListItemResponse>**

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

