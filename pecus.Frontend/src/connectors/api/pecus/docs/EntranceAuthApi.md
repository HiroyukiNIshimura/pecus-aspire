# EntranceAuthApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiEntranceAuthLoginPost**](#apientranceauthloginpost) | **POST** /api/entrance/auth/login | ログイン|

# **apiEntranceAuthLoginPost**
> LoginResponse apiEntranceAuthLoginPost()

EmailまたはLoginIdとパスワードでログインします

### Example

```typescript
import {
    EntranceAuthApi,
    Configuration,
    LoginRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new EntranceAuthApi(configuration);

let loginRequest: LoginRequest; // (optional)

const { status, data } = await apiInstance.apiEntranceAuthLoginPost(
    loginRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginRequest** | **LoginRequest**|  | |


### Return type

**LoginResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

