# ProfileApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiProfileEmailPatch**](#apiprofileemailpatch) | **PATCH** /api/profile/email | メールアドレスを変更|
|[**apiProfileGet**](#apiprofileget) | **GET** /api/profile | 自分のプロフィール情報を取得|
|[**apiProfilePut**](#apiprofileput) | **PUT** /api/profile | 自分のプロフィール情報を更新|

# **apiProfileEmailPatch**
> apiProfileEmailPatch()


### Example

```typescript
import {
    ProfileApi,
    Configuration,
    UpdateEmailRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProfileApi(configuration);

let updateEmailRequest: UpdateEmailRequest; //変更情報 (optional)

const { status, data } = await apiInstance.apiProfileEmailPatch(
    updateEmailRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateEmailRequest** | **UpdateEmailRequest**| 変更情報 | |


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

# **apiProfileGet**
> apiProfileGet()


### Example

```typescript
import {
    ProfileApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProfileApi(configuration);

const { status, data } = await apiInstance.apiProfileGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiProfilePut**
> apiProfilePut()


### Example

```typescript
import {
    ProfileApi,
    Configuration,
    UpdateProfileRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProfileApi(configuration);

let updateProfileRequest: UpdateProfileRequest; //更新情報 (optional)

const { status, data } = await apiInstance.apiProfilePut(
    updateProfileRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateProfileRequest** | **UpdateProfileRequest**| 更新情報 | |


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

