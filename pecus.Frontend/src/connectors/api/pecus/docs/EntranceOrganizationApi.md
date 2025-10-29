# EntranceOrganizationApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiEntranceOrganizationsPost**](#apientranceorganizationspost) | **POST** /api/entrance/organizations | 組織登録（管理者ユーザーも同時作成）|

# **apiEntranceOrganizationsPost**
> OrganizationWithAdminResponse apiEntranceOrganizationsPost()

新規組織を登録し、管理者ユーザーを同時に作成します。  このエンドポイントは未認証でアクセス可能です（新規サインアップ用）。

### Example

```typescript
import {
    EntranceOrganizationApi,
    Configuration,
    CreateOrganizationRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new EntranceOrganizationApi(configuration);

let createOrganizationRequest: CreateOrganizationRequest; // (optional)

const { status, data } = await apiInstance.apiEntranceOrganizationsPost(
    createOrganizationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createOrganizationRequest** | **CreateOrganizationRequest**|  | |


### Return type

**OrganizationWithAdminResponse**

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

