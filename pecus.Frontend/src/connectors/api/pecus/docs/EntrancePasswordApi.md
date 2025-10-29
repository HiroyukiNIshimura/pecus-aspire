# EntrancePasswordApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiEntrancePasswordRequestResetPost**](#apientrancepasswordrequestresetpost) | **POST** /api/entrance/password/request-reset | パスワードリセットをリクエスト|
|[**apiEntrancePasswordResetPost**](#apientrancepasswordresetpost) | **POST** /api/entrance/password/reset | パスワードをリセット|
|[**apiEntrancePasswordSetPost**](#apientrancepasswordsetpost) | **POST** /api/entrance/password/set | /// パスワードを設定|

# **apiEntrancePasswordRequestResetPost**
> SuccessResponse apiEntrancePasswordRequestResetPost()

メールアドレスを入力してパスワードリセットをリクエストします。  パスワードリセット用のメールが送信されます。

### Example

```typescript
import {
    EntrancePasswordApi,
    Configuration,
    RequestPasswordResetRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new EntrancePasswordApi(configuration);

let requestPasswordResetRequest: RequestPasswordResetRequest; //パスワードリセットリクエスト (optional)

const { status, data } = await apiInstance.apiEntrancePasswordRequestResetPost(
    requestPasswordResetRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **requestPasswordResetRequest** | **RequestPasswordResetRequest**| パスワードリセットリクエスト | |


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
|**200** | パスワードリセットメールが送信されました |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiEntrancePasswordResetPost**
> SuccessResponse apiEntrancePasswordResetPost()

メールで送信されたトークンを使ってパスワードをリセットします。  トークンは24時間有効です。

### Example

```typescript
import {
    EntrancePasswordApi,
    Configuration,
    ResetPasswordRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new EntrancePasswordApi(configuration);

let resetPasswordRequest: ResetPasswordRequest; //パスワードリセットリクエスト (optional)

const { status, data } = await apiInstance.apiEntrancePasswordResetPost(
    resetPasswordRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resetPasswordRequest** | **ResetPasswordRequest**| パスワードリセットリクエスト | |


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
|**200** | パスワードがリセットされました |  -  |
|**400** | トークンが無効または期限切れです |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiEntrancePasswordSetPost**
> SuccessResponse apiEntrancePasswordSetPost()

メールで送信されたトークンを使ってパスワードを設定します。  トークンは24時間有効です。

### Example

```typescript
import {
    EntrancePasswordApi,
    Configuration,
    SetUserPasswordRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new EntrancePasswordApi(configuration);

let setUserPasswordRequest: SetUserPasswordRequest; //パスワード設定リクエスト (optional)

const { status, data } = await apiInstance.apiEntrancePasswordSetPost(
    setUserPasswordRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setUserPasswordRequest** | **SetUserPasswordRequest**| パスワード設定リクエスト | |


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
|**200** | パスワードが設定されました |  -  |
|**400** | トークンが無効または期限切れです |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

