# RefreshApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiEntranceLogoutPost**](#apientrancelogoutpost) | **POST** /api/entrance/logout | ログアウト（トークン無効化）|
|[**apiEntranceRefreshPost**](#apientrancerefreshpost) | **POST** /api/entrance/refresh | リフレッシュトークンによるアクセストークン再発行|

# **apiEntranceLogoutPost**
> apiEntranceLogoutPost()

現在のアクセストークンとリフレッシュトークンを無効化します。

### Example

```typescript
import {
    RefreshApi,
    Configuration,
    RefreshRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RefreshApi(configuration);

let refreshRequest: RefreshRequest; //リフレッシュトークン情報 (optional)

const { status, data } = await apiInstance.apiEntranceLogoutPost(
    refreshRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **refreshRequest** | **RefreshRequest**| リフレッシュトークン情報 | |


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiEntranceRefreshPost**
> apiEntranceRefreshPost()

有効なリフレッシュトークンを使用して、新しいアクセストークンとリフレッシュトークンを取得します。

### Example

```typescript
import {
    RefreshApi,
    Configuration,
    RefreshRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RefreshApi(configuration);

let refreshRequest: RefreshRequest; //リフレッシュトークン情報 (optional)

const { status, data } = await apiInstance.apiEntranceRefreshPost(
    refreshRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **refreshRequest** | **RefreshRequest**| リフレッシュトークン情報 | |


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

