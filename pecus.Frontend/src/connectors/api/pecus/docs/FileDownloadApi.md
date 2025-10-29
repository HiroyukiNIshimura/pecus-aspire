# FileDownloadApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiDownloadsFileTypeResourceIdFileNameGet**](#apidownloadsfiletyperesourceidfilenameget) | **GET** /api/downloads/{fileType}/{resourceId}/{fileName} | アイコンファイルを取得（画像を返す）|

# **apiDownloadsFileTypeResourceIdFileNameGet**
> apiDownloadsFileTypeResourceIdFileNameGet()


### Example

```typescript
import {
    FileDownloadApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileDownloadApi(configuration);

let fileType: string; //ファイルの種類（avatar, genre） (default to undefined)
let resourceId: number; //リソースID (default to undefined)
let fileName: string; //ファイル名 (default to undefined)

const { status, data } = await apiInstance.apiDownloadsFileTypeResourceIdFileNameGet(
    fileType,
    resourceId,
    fileName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fileType** | [**string**] | ファイルの種類（avatar, genre） | defaults to undefined|
| **resourceId** | [**number**] | リソースID | defaults to undefined|
| **fileName** | [**string**] | ファイル名 | defaults to undefined|


### Return type

void (empty response body)

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

