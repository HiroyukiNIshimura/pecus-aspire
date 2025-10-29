# BackendGenreApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBackendGenresGet**](#apibackendgenresget) | **GET** /api/backend/genres | ジャンル一覧を取得|
|[**apiBackendGenresIdActiveStatusPut**](#apibackendgenresidactivestatusput) | **PUT** /api/backend/genres/{id}/active-status | ジャンルのアクティブ状態を設定|
|[**apiBackendGenresIdDelete**](#apibackendgenresiddelete) | **DELETE** /api/backend/genres/{id} | ジャンルを削除|
|[**apiBackendGenresIdGet**](#apibackendgenresidget) | **GET** /api/backend/genres/{id} | ジャンル詳細を取得|
|[**apiBackendGenresIdPut**](#apibackendgenresidput) | **PUT** /api/backend/genres/{id} | ジャンルを更新|
|[**apiBackendGenresPost**](#apibackendgenrespost) | **POST** /api/backend/genres | ジャンルを作成|

# **apiBackendGenresGet**
> GenreListItemResponsePagedResponse apiBackendGenresGet()


### Example

```typescript
import {
    BackendGenreApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendGenreApi(configuration);

let page: number; // (optional) (default to undefined)
let activeOnly: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiBackendGenresGet(
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

**GenreListItemResponsePagedResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendGenresIdActiveStatusPut**
> SuccessResponse apiBackendGenresIdActiveStatusPut()


### Example

```typescript
import {
    BackendGenreApi,
    Configuration,
    SetActiveStatusRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendGenreApi(configuration);

let id: number; //ジャンルID (default to undefined)
let setActiveStatusRequest: SetActiveStatusRequest; //アクティブ状態設定リクエスト (optional)

const { status, data } = await apiInstance.apiBackendGenresIdActiveStatusPut(
    id,
    setActiveStatusRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setActiveStatusRequest** | **SetActiveStatusRequest**| アクティブ状態設定リクエスト | |
| **id** | [**number**] | ジャンルID | defaults to undefined|


### Return type

**SuccessResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendGenresIdDelete**
> SuccessResponse apiBackendGenresIdDelete()


### Example

```typescript
import {
    BackendGenreApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendGenreApi(configuration);

let id: number; //ジャンルID (default to undefined)

const { status, data } = await apiInstance.apiBackendGenresIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ジャンルID | defaults to undefined|


### Return type

**SuccessResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendGenresIdGet**
> GenreDetailResponse apiBackendGenresIdGet()


### Example

```typescript
import {
    BackendGenreApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendGenreApi(configuration);

let id: number; //ジャンルID (default to undefined)

const { status, data } = await apiInstance.apiBackendGenresIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ジャンルID | defaults to undefined|


### Return type

**GenreDetailResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendGenresIdPut**
> GenreResponse apiBackendGenresIdPut()


### Example

```typescript
import {
    BackendGenreApi,
    Configuration,
    UpdateGenreRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendGenreApi(configuration);

let id: number; //ジャンルID (default to undefined)
let updateGenreRequest: UpdateGenreRequest; //ジャンル更新リクエスト (optional)

const { status, data } = await apiInstance.apiBackendGenresIdPut(
    id,
    updateGenreRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateGenreRequest** | **UpdateGenreRequest**| ジャンル更新リクエスト | |
| **id** | [**number**] | ジャンルID | defaults to undefined|


### Return type

**GenreResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendGenresPost**
> GenreResponse apiBackendGenresPost()


### Example

```typescript
import {
    BackendGenreApi,
    Configuration,
    CreateGenreRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendGenreApi(configuration);

let createGenreRequest: CreateGenreRequest; //ジャンル作成リクエスト (optional)

const { status, data } = await apiInstance.apiBackendGenresPost(
    createGenreRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createGenreRequest** | **CreateGenreRequest**| ジャンル作成リクエスト | |


### Return type

**GenreResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

