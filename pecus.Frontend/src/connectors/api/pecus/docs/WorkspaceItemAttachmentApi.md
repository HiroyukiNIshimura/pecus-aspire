# WorkspaceItemAttachmentApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiWorkspacesWorkspaceIdItemsItemIdAttachmentsAttachmentIdDelete**](#apiworkspacesworkspaceiditemsitemidattachmentsattachmentiddelete) | **DELETE** /api/workspaces/{workspaceId}/items/{itemId}/attachments/{attachmentId} | 添付ファイルを削除|
|[**apiWorkspacesWorkspaceIdItemsItemIdAttachmentsDownloadFileNameGet**](#apiworkspacesworkspaceiditemsitemidattachmentsdownloadfilenameget) | **GET** /api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{fileName} | 添付ファイルをダウンロード|
|[**apiWorkspacesWorkspaceIdItemsItemIdAttachmentsGet**](#apiworkspacesworkspaceiditemsitemidattachmentsget) | **GET** /api/workspaces/{workspaceId}/items/{itemId}/attachments | ワークスペースアイテムの添付ファイル一覧を取得|
|[**apiWorkspacesWorkspaceIdItemsItemIdAttachmentsPost**](#apiworkspacesworkspaceiditemsitemidattachmentspost) | **POST** /api/workspaces/{workspaceId}/items/{itemId}/attachments | ワークスペースアイテムに添付ファイルをアップロード|

# **apiWorkspacesWorkspaceIdItemsItemIdAttachmentsAttachmentIdDelete**
> apiWorkspacesWorkspaceIdItemsItemIdAttachmentsAttachmentIdDelete()


### Example

```typescript
import {
    WorkspaceItemAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemAttachmentApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)
let attachmentId: number; //添付ファイルID (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdAttachmentsAttachmentIdDelete(
    workspaceId,
    itemId,
    attachmentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|
| **attachmentId** | [**number**] | 添付ファイルID | defaults to undefined|


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
|**204** | No Content |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdAttachmentsDownloadFileNameGet**
> apiWorkspacesWorkspaceIdItemsItemIdAttachmentsDownloadFileNameGet()


### Example

```typescript
import {
    WorkspaceItemAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemAttachmentApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)
let fileName: string; //ファイル名（一意なファイル名） (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdAttachmentsDownloadFileNameGet(
    workspaceId,
    itemId,
    fileName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|
| **fileName** | [**string**] | ファイル名（一意なファイル名） | defaults to undefined|


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
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWorkspacesWorkspaceIdItemsItemIdAttachmentsGet**
> Array<WorkspaceItemAttachmentResponse> apiWorkspacesWorkspaceIdItemsItemIdAttachmentsGet()


### Example

```typescript
import {
    WorkspaceItemAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemAttachmentApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdAttachmentsGet(
    workspaceId,
    itemId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|


### Return type

**Array<WorkspaceItemAttachmentResponse>**

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

# **apiWorkspacesWorkspaceIdItemsItemIdAttachmentsPost**
> WorkspaceItemAttachmentResponse apiWorkspacesWorkspaceIdItemsItemIdAttachmentsPost()


### Example

```typescript
import {
    WorkspaceItemAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspaceItemAttachmentApi(configuration);

let workspaceId: number; //ワークスペースID (default to undefined)
let itemId: number; //アイテムID (default to undefined)
let file: File; //アップロードするファイル (optional) (default to undefined)

const { status, data } = await apiInstance.apiWorkspacesWorkspaceIdItemsItemIdAttachmentsPost(
    workspaceId,
    itemId,
    file
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**number**] | ワークスペースID | defaults to undefined|
| **itemId** | [**number**] | アイテムID | defaults to undefined|
| **file** | [**File**] | アップロードするファイル | (optional) defaults to undefined|


### Return type

**WorkspaceItemAttachmentResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

