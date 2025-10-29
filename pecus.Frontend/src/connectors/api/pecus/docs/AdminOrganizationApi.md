# AdminOrganizationApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiAdminOrganizationGet**](#apiadminorganizationget) | **GET** /api/admin/organization | 自組織の情報を取得|
|[**apiAdminOrganizationPut**](#apiadminorganizationput) | **PUT** /api/admin/organization | 自組織の情報を更新|

# **apiAdminOrganizationGet**
> OrganizationDetailResponse apiAdminOrganizationGet()

ログイン中のユーザーが属する組織の詳細情報を取得します。

### Example

```typescript
import {
    AdminOrganizationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminOrganizationApi(configuration);

const { status, data } = await apiInstance.apiAdminOrganizationGet();
```

### Parameters
This endpoint does not have any parameters.


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

# **apiAdminOrganizationPut**
> OrganizationResponse apiAdminOrganizationPut()

ログイン中のユーザーが属する組織の情報を更新します。

### Example

```typescript
import {
    AdminOrganizationApi,
    Configuration,
    UpdateOrganizationRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminOrganizationApi(configuration);

let updateOrganizationRequest: UpdateOrganizationRequest; // (optional)

const { status, data } = await apiInstance.apiAdminOrganizationPut(
    updateOrganizationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateOrganizationRequest** | **UpdateOrganizationRequest**|  | |


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

