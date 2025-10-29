# BackendSpecsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiBackendSpecsOpenapiDocumentNameGet**](#apibackendspecsopenapidocumentnameget) | **GET** /api/backend/specs/openapi/{documentName} | OpenAPIスキーマ取得|
|[**apiBackendSpecsOpenapiDocumentNameYamlGet**](#apibackendspecsopenapidocumentnameyamlget) | **GET** /api/backend/specs/openapi/{documentName}.yaml | OpenAPIスキーマ取得（YAML形式）|
|[**apiBackendSpecsOpenapiGet**](#apibackendspecsopenapiget) | **GET** /api/backend/specs/openapi | OpenAPIスキーマ取得|
|[**apiBackendSpecsOpenapiYamlGet**](#apibackendspecsopenapiyamlget) | **GET** /api/backend/specs/openapi.yaml | OpenAPIスキーマ取得（YAML形式）|

# **apiBackendSpecsOpenapiDocumentNameGet**
> string apiBackendSpecsOpenapiDocumentNameGet()

Swagger UIで生成されたOpenAPI 3.0スキーマをJSON形式で取得します。

### Example

```typescript
import {
    BackendSpecsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendSpecsApi(configuration);

let documentName: string; //ドキュメント名（デフォルト: v1） (default to 'v1')

const { status, data } = await apiInstance.apiBackendSpecsOpenapiDocumentNameGet(
    documentName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentName** | [**string**] | ドキュメント名（デフォルト: v1） | defaults to 'v1'|


### Return type

**string**

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

# **apiBackendSpecsOpenapiDocumentNameYamlGet**
> string apiBackendSpecsOpenapiDocumentNameYamlGet()

Swagger UIで生成されたOpenAPI 3.0スキーマをYAML形式で取得します。

### Example

```typescript
import {
    BackendSpecsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendSpecsApi(configuration);

let documentName: string; //ドキュメント名（デフォルト: v1） (default to 'v1')

const { status, data } = await apiInstance.apiBackendSpecsOpenapiDocumentNameYamlGet(
    documentName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentName** | [**string**] | ドキュメント名（デフォルト: v1） | defaults to 'v1'|


### Return type

**string**

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

# **apiBackendSpecsOpenapiGet**
> string apiBackendSpecsOpenapiGet()

Swagger UIで生成されたOpenAPI 3.0スキーマをJSON形式で取得します。

### Example

```typescript
import {
    BackendSpecsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendSpecsApi(configuration);

const { status, data } = await apiInstance.apiBackendSpecsOpenapiGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**string**

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

# **apiBackendSpecsOpenapiYamlGet**
> string apiBackendSpecsOpenapiYamlGet()

Swagger UIで生成されたOpenAPI 3.0スキーマをYAML形式で取得します。

### Example

```typescript
import {
    BackendSpecsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BackendSpecsApi(configuration);

const { status, data } = await apiInstance.apiBackendSpecsOpenapiYamlGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**string**

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

