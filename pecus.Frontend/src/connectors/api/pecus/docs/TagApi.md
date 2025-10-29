# TagApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTagsGet**](#apitagsget) | **GET** /api/tags | 組織のタグ一覧取得|
|[**apiTagsPost**](#apitagspost) | **POST** /api/tags | タグ作成|
|[**apiTagsTagIdDelete**](#apitagstagiddelete) | **DELETE** /api/tags/{tagId} | タグ削除|
|[**apiTagsTagIdPut**](#apitagstagidput) | **PUT** /api/tags/{tagId} | タグ更新|

# **apiTagsGet**
> Array<TagDetailResponse> apiTagsGet()


### Example

```typescript
import {
    TagApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TagApi(configuration);

const { status, data } = await apiInstance.apiTagsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<TagDetailResponse>**

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

# **apiTagsPost**
> TagResponse apiTagsPost()


### Example

```typescript
import {
    TagApi,
    Configuration,
    CreateTagRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TagApi(configuration);

let createTagRequest: CreateTagRequest; // (optional)

const { status, data } = await apiInstance.apiTagsPost(
    createTagRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createTagRequest** | **CreateTagRequest**|  | |


### Return type

**TagResponse**

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

# **apiTagsTagIdDelete**
> SuccessResponse apiTagsTagIdDelete()


### Example

```typescript
import {
    TagApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TagApi(configuration);

let tagId: number; // (default to undefined)

const { status, data } = await apiInstance.apiTagsTagIdDelete(
    tagId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **tagId** | [**number**] |  | defaults to undefined|


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
|**200** | OK |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTagsTagIdPut**
> TagResponse apiTagsTagIdPut()


### Example

```typescript
import {
    TagApi,
    Configuration,
    UpdateTagRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TagApi(configuration);

let tagId: number; // (default to undefined)
let updateTagRequest: UpdateTagRequest; // (optional)

const { status, data } = await apiInstance.apiTagsTagIdPut(
    tagId,
    updateTagRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateTagRequest** | **UpdateTagRequest**|  | |
| **tagId** | [**number**] |  | defaults to undefined|


### Return type

**TagResponse**

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

