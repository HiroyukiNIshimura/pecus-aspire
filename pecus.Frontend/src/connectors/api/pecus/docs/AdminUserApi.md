# AdminUserApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiAdminUsersCreateWithoutPasswordPost**](#apiadminuserscreatewithoutpasswordpost) | **POST** /api/admin/users/create-without-password | パスワードなしでユーザーを作成|
|[**apiAdminUsersGet**](#apiadminusersget) | **GET** /api/admin/users | 組織内のユーザー一覧を取得（ページング）|
|[**apiAdminUsersIdActiveStatusPut**](#apiadminusersidactivestatusput) | **PUT** /api/admin/users/{id}/active-status | ユーザーのアクティブ状態を設定|
|[**apiAdminUsersIdDelete**](#apiadminusersiddelete) | **DELETE** /api/admin/users/{id} | ユーザーを削除|
|[**apiAdminUsersIdRequestPasswordResetPost**](#apiadminusersidrequestpasswordresetpost) | **POST** /api/admin/users/{id}/request-password-reset | ユーザーのパスワードリセットをリクエスト|
|[**apiAdminUsersIdSkillsPut**](#apiadminusersidskillsput) | **PUT** /api/admin/users/{id}/skills | ユーザーのスキルを設定|

# **apiAdminUsersCreateWithoutPasswordPost**
> UserResponse apiAdminUsersCreateWithoutPasswordPost()

ユーザー名とメールアドレスのみでユーザーを作成します。パスワードは後で設定されます。  作成されたユーザーにはパスワード設定用のトークンが発行され、メールで通知されます。

### Example

```typescript
import {
    AdminUserApi,
    Configuration,
    CreateUserWithoutPasswordRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminUserApi(configuration);

let createUserWithoutPasswordRequest: CreateUserWithoutPasswordRequest; //ユーザー作成リクエスト (optional)

const { status, data } = await apiInstance.apiAdminUsersCreateWithoutPasswordPost(
    createUserWithoutPasswordRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createUserWithoutPasswordRequest** | **CreateUserWithoutPasswordRequest**| ユーザー作成リクエスト | |


### Return type

**UserResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | ユーザーが作成されました |  -  |
|**400** | リクエストが無効です |  -  |
|**404** | 組織が見つかりません |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiAdminUsersGet**
> UserResponsePagedResponse apiAdminUsersGet()

ログインユーザーの組織に所属するユーザーの一覧をページングで取得します。

### Example

```typescript
import {
    AdminUserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminUserApi(configuration);

let page: number; // (optional) (default to undefined)
let pageSize: number; // (optional) (default to undefined)
let activeOnly: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiAdminUsersGet(
    page,
    pageSize,
    activeOnly
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] |  | (optional) defaults to undefined|
| **pageSize** | [**number**] |  | (optional) defaults to undefined|
| **activeOnly** | [**boolean**] |  | (optional) defaults to undefined|


### Return type

**UserResponsePagedResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | ユーザー一覧を返します |  -  |
|**404** | 組織が見つかりません |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiAdminUsersIdActiveStatusPut**
> SuccessResponse apiAdminUsersIdActiveStatusPut()

指定したユーザーのアクティブ状態を設定します。組織内のユーザーのみ操作可能です。

### Example

```typescript
import {
    AdminUserApi,
    Configuration,
    SetUserActiveStatusRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminUserApi(configuration);

let id: number; //ユーザーID (default to undefined)
let setUserActiveStatusRequest: SetUserActiveStatusRequest; //アクティブ状態設定リクエスト (optional)

const { status, data } = await apiInstance.apiAdminUsersIdActiveStatusPut(
    id,
    setUserActiveStatusRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setUserActiveStatusRequest** | **SetUserActiveStatusRequest**| アクティブ状態設定リクエスト | |
| **id** | [**number**] | ユーザーID | defaults to undefined|


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
|**200** | ユーザーのアクティブ状態を設定しました |  -  |
|**403** | 他組織のユーザーは操作できません |  -  |
|**404** | ユーザーが見つかりません |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiAdminUsersIdDelete**
> SuccessResponse apiAdminUsersIdDelete()

指定したユーザーを削除します。組織内のユーザーのみ操作可能です。

### Example

```typescript
import {
    AdminUserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminUserApi(configuration);

let id: number; //ユーザーID (default to undefined)

const { status, data } = await apiInstance.apiAdminUsersIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ユーザーID | defaults to undefined|


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
|**200** | ユーザーを削除しました |  -  |
|**403** | 他組織のユーザーは操作できません |  -  |
|**404** | ユーザーが見つかりません |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiAdminUsersIdRequestPasswordResetPost**
> SuccessResponse apiAdminUsersIdRequestPasswordResetPost()

指定したユーザーのパスワードリセットをリクエストします。組織内のユーザーのみ操作可能です。  パスワードリセット用のメールがユーザーに送信されます。

### Example

```typescript
import {
    AdminUserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminUserApi(configuration);

let id: number; //ユーザーID (default to undefined)

const { status, data } = await apiInstance.apiAdminUsersIdRequestPasswordResetPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ユーザーID | defaults to undefined|


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
|**200** | パスワードリセットメールが送信されました |  -  |
|**403** | 他組織のユーザーは操作できません |  -  |
|**404** | ユーザーが見つかりません |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiAdminUsersIdSkillsPut**
> SuccessResponse apiAdminUsersIdSkillsPut()

指定したユーザーのスキルを設定します（洗い替え）。組織内のユーザーのみ操作可能です。

### Example

```typescript
import {
    AdminUserApi,
    Configuration,
    SetUserSkillsRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminUserApi(configuration);

let id: number; //ユーザーID (default to undefined)
let setUserSkillsRequest: SetUserSkillsRequest; //スキルIDのリスト (optional)

const { status, data } = await apiInstance.apiAdminUsersIdSkillsPut(
    id,
    setUserSkillsRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setUserSkillsRequest** | **SetUserSkillsRequest**| スキルIDのリスト | |
| **id** | [**number**] | ユーザーID | defaults to undefined|


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
|**200** | スキルを設定しました |  -  |
|**403** | 他組織のユーザーは操作できません |  -  |
|**404** | ユーザーが見つかりません |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

