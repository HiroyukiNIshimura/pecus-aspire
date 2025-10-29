# TestEmailApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiDevEmailTestSendPost**](#apidevemailtestsendpost) | **POST** /api/dev/email-test/send | テスト送信（テンプレート名を指定）|
|[**apiDevEmailTestSetRecipientPost**](#apidevemailtestsetrecipientpost) | **POST** /api/dev/email-test/set-recipient | テスト用受信先を設定する|
|[**apiDevEmailTestTemplatesGet**](#apidevemailtesttemplatesget) | **GET** /api/dev/email-test/templates | 利用可能なテンプレート一覧を返す|

# **apiDevEmailTestSendPost**
> MessageResponse apiDevEmailTestSendPost()


### Example

```typescript
import {
    TestEmailApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TestEmailApi(configuration);

let template: string; //テンプレート名（welcome, password-setup, password-reset, test-email） (optional) (default to undefined)

const { status, data } = await apiInstance.apiDevEmailTestSendPost(
    template
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **template** | [**string**] | テンプレート名（welcome, password-setup, password-reset, test-email） | (optional) defaults to undefined|


### Return type

**MessageResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiDevEmailTestSetRecipientPost**
> MessageResponse apiDevEmailTestSetRecipientPost()


### Example

```typescript
import {
    TestEmailApi,
    Configuration,
    RecipientRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TestEmailApi(configuration);

let recipientRequest: RecipientRequest; // (optional)

const { status, data } = await apiInstance.apiDevEmailTestSetRecipientPost(
    recipientRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **recipientRequest** | **RecipientRequest**|  | |


### Return type

**MessageResponse**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiDevEmailTestTemplatesGet**
> Array<string> apiDevEmailTestTemplatesGet()


### Example

```typescript
import {
    TestEmailApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TestEmailApi(configuration);

const { status, data } = await apiInstance.apiDevEmailTestTemplatesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<string>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

