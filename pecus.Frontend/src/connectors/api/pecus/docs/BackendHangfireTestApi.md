# BackendHangfireTestApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBackendHangfireTestBatchPost**](#apibackendhangfiretestbatchpost) | **POST** /api/backend/hangfire-test/batch | バッチジョブのテスト|
|[**apiBackendHangfireTestContinuationPost**](#apibackendhangfiretestcontinuationpost) | **POST** /api/backend/hangfire-test/continuation | 継続ジョブのテスト|
|[**apiBackendHangfireTestDelayedPost**](#apibackendhangfiretestdelayedpost) | **POST** /api/backend/hangfire-test/delayed | 遅延ジョブのテスト|
|[**apiBackendHangfireTestErrorPost**](#apibackendhangfiretesterrorpost) | **POST** /api/backend/hangfire-test/error | エラーを発生させるジョブのテスト|
|[**apiBackendHangfireTestFailedJobIdDelete**](#apibackendhangfiretestfailedjobiddelete) | **DELETE** /api/backend/hangfire-test/failed/{jobId} | 失敗したジョブを削除|
|[**apiBackendHangfireTestFireAndForgetPost**](#apibackendhangfiretestfireandforgetpost) | **POST** /api/backend/hangfire-test/fire-and-forget | Fire-and-forget ジョブのテスト|
|[**apiBackendHangfireTestLongRunningPost**](#apibackendhangfiretestlongrunningpost) | **POST** /api/backend/hangfire-test/long-running | 長時間実行ジョブのテスト|
|[**apiBackendHangfireTestRecurringPost**](#apibackendhangfiretestrecurringpost) | **POST** /api/backend/hangfire-test/recurring | 繰り返しジョブのテスト（Cron式）|
|[**apiBackendHangfireTestRecurringRecurringJobIdDelete**](#apibackendhangfiretestrecurringrecurringjobiddelete) | **DELETE** /api/backend/hangfire-test/recurring/{recurringJobId} | 繰り返しジョブの削除|

# **apiBackendHangfireTestBatchPost**
> BatchResponse apiBackendHangfireTestBatchPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let count: number; //ジョブ数 (optional) (default to 5)

const { status, data } = await apiInstance.apiBackendHangfireTestBatchPost(
    count
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **count** | [**number**] | ジョブ数 | (optional) defaults to 5|


### Return type

**BatchResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestContinuationPost**
> ContinuationResponse apiBackendHangfireTestContinuationPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let parentMessage: string; //親ジョブのメッセージ (optional) (default to 'Parent job')
let childMessage: string; //子ジョブのメッセージ (optional) (default to 'Child job')

const { status, data } = await apiInstance.apiBackendHangfireTestContinuationPost(
    parentMessage,
    childMessage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **parentMessage** | [**string**] | 親ジョブのメッセージ | (optional) defaults to 'Parent job'|
| **childMessage** | [**string**] | 子ジョブのメッセージ | (optional) defaults to 'Child job'|


### Return type

**ContinuationResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestDelayedPost**
> JobResponse apiBackendHangfireTestDelayedPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let message: string; //ログに出力するメッセージ (optional) (default to 'Delayed job executed!')
let delaySeconds: number; //遅延秒数（デフォルト: 10秒） (optional) (default to 10)

const { status, data } = await apiInstance.apiBackendHangfireTestDelayedPost(
    message,
    delaySeconds
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **message** | [**string**] | ログに出力するメッセージ | (optional) defaults to 'Delayed job executed!'|
| **delaySeconds** | [**number**] | 遅延秒数（デフォルト: 10秒） | (optional) defaults to 10|


### Return type

**JobResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestErrorPost**
> JobResponse apiBackendHangfireTestErrorPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let errorMessage: string; //エラーメッセージ (optional) (default to 'Test error')

const { status, data } = await apiInstance.apiBackendHangfireTestErrorPost(
    errorMessage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **errorMessage** | [**string**] | エラーメッセージ | (optional) defaults to 'Test error'|


### Return type

**JobResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestFailedJobIdDelete**
> MessageResponse apiBackendHangfireTestFailedJobIdDelete()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let jobId: string; //削除するジョブID (default to undefined)

const { status, data } = await apiInstance.apiBackendHangfireTestFailedJobIdDelete(
    jobId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **jobId** | [**string**] | 削除するジョブID | defaults to undefined|


### Return type

**MessageResponse**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestFireAndForgetPost**
> JobResponse apiBackendHangfireTestFireAndForgetPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let message: string; //ログに出力するメッセージ (optional) (default to 'Hello from Hangfire!')

const { status, data } = await apiInstance.apiBackendHangfireTestFireAndForgetPost(
    message
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **message** | [**string**] | ログに出力するメッセージ | (optional) defaults to 'Hello from Hangfire!'|


### Return type

**JobResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestLongRunningPost**
> JobResponse apiBackendHangfireTestLongRunningPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let durationSeconds: number; //実行時間（秒） (optional) (default to 30)

const { status, data } = await apiInstance.apiBackendHangfireTestLongRunningPost(
    durationSeconds
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **durationSeconds** | [**number**] | 実行時間（秒） | (optional) defaults to 30|


### Return type

**JobResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestRecurringPost**
> RecurringResponse apiBackendHangfireTestRecurringPost()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let message: string; //ログに出力するメッセージ (optional) (default to 'Recurring job executed!')
let cronExpression: string; //Cron式（デフォルト: 毎分実行） (optional) (default to '* * * * *')

const { status, data } = await apiInstance.apiBackendHangfireTestRecurringPost(
    message,
    cronExpression
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **message** | [**string**] | ログに出力するメッセージ | (optional) defaults to 'Recurring job executed!'|
| **cronExpression** | [**string**] | Cron式（デフォルト: 毎分実行） | (optional) defaults to '* * * * *'|


### Return type

**RecurringResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiBackendHangfireTestRecurringRecurringJobIdDelete**
> MessageResponse apiBackendHangfireTestRecurringRecurringJobIdDelete()


### Example

```typescript
import {
    BackendHangfireTestApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendHangfireTestApi(configuration);

let recurringJobId: string; //削除する繰り返しジョブID (default to undefined)

const { status, data } = await apiInstance.apiBackendHangfireTestRecurringRecurringJobIdDelete(
    recurringJobId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **recurringJobId** | [**string**] | 削除する繰り返しジョブID | defaults to undefined|


### Return type

**MessageResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

