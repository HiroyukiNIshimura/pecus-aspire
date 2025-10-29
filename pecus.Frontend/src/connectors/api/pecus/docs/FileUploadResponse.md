# FileUploadResponse

ファイルアップロードレスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **boolean** | アップロード成功フラグ | [optional] [default to undefined]
**fileUrl** | **string** | ファイルURL（公開アクセス用） | [optional] [default to undefined]
**fileSize** | **number** | ファイルサイズ（バイト） | [optional] [default to undefined]
**contentType** | **string** | ファイル形式 | [optional] [default to undefined]
**uploadedAt** | **string** | アップロード日時 | [optional] [default to undefined]
**message** | **string** | メッセージ | [optional] [default to undefined]

## Example

```typescript
import { FileUploadResponse } from './api';

const instance: FileUploadResponse = {
    success,
    fileUrl,
    fileSize,
    contentType,
    uploadedAt,
    message,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
