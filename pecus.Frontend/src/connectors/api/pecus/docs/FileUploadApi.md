# FileUploadApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiFilesFileTypeResourceIdPost**](#apifilesfiletyperesourceidpost) | **POST** /api/files/{fileType}/{resourceId} | ファイルをアップロード|

# **apiFilesFileTypeResourceIdPost**
> FileUploadResponse apiFilesFileTypeResourceIdPost()


### Example

```typescript
import {
    FileUploadApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileUploadApi(configuration);

let fileType: string; //ファイルの種類（avatar, genre） (default to undefined)
let resourceId: number; //リソースID (default to undefined)
let file: File; //アップロードするファイル (optional) (default to undefined)

const { status, data } = await apiInstance.apiFilesFileTypeResourceIdPost(
    fileType,
    resourceId,
    file
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fileType** | [**string**] | ファイルの種類（avatar, genre） | defaults to undefined|
| **resourceId** | [**number**] | リソースID | defaults to undefined|
| **file** | [**File**] | アップロードするファイル | (optional) defaults to undefined|


### Return type

**FileUploadResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**403** | Forbidden |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

