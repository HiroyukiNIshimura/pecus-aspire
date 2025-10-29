# WorkspaceItemAttachmentResponse

ワークスペースアイテム添付ファイルレスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | 添付ファイルID | [optional] [default to undefined]
**workspaceItemId** | **number** | ワークスペースアイテムID | [optional] [default to undefined]
**fileName** | **string** | ファイル名 | [optional] [default to undefined]
**fileSize** | **number** | ファイルサイズ（バイト） | [optional] [default to undefined]
**mimeType** | **string** | MIMEタイプ | [optional] [default to undefined]
**downloadUrl** | **string** | ダウンロードURL | [optional] [default to undefined]
**thumbnailMediumUrl** | **string** | サムネイル（サイズM）URL | [optional] [default to undefined]
**thumbnailSmallUrl** | **string** | サムネイル（サイズS）URL | [optional] [default to undefined]
**uploadedAt** | **string** | アップロード日時 | [optional] [default to undefined]
**uploadedByUserId** | **number** | アップロードしたユーザーID | [optional] [default to undefined]
**uploadedByUsername** | **string** | アップロードしたユーザー名 | [optional] [default to undefined]

## Example

```typescript
import { WorkspaceItemAttachmentResponse } from './api';

const instance: WorkspaceItemAttachmentResponse = {
    id,
    workspaceItemId,
    fileName,
    fileSize,
    mimeType,
    downloadUrl,
    thumbnailMediumUrl,
    thumbnailSmallUrl,
    uploadedAt,
    uploadedByUserId,
    uploadedByUsername,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
