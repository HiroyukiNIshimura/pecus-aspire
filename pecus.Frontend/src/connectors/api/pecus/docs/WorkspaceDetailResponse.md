# WorkspaceDetailResponse

ワークスペース詳細情報レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ワークスペースID | [optional] [default to undefined]
**name** | **string** | ワークスペース名 | [default to undefined]
**code** | **string** | ワークスペースコード | [optional] [default to undefined]
**description** | **string** | ワークスペースの説明 | [optional] [default to undefined]
**organizationId** | **number** | 組織ID | [optional] [default to undefined]
**organization** | [**OrganizationInfoResponse**](OrganizationInfoResponse.md) |  | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**createdByUserId** | **number** | 作成者ユーザーID | [optional] [default to undefined]
**updatedAt** | **string** | 更新日時 | [optional] [default to undefined]
**updatedByUserId** | **number** | 更新者ユーザーID | [optional] [default to undefined]
**isActive** | **boolean** | アクティブフラグ | [optional] [default to undefined]

## Example

```typescript
import { WorkspaceDetailResponse } from './api';

const instance: WorkspaceDetailResponse = {
    id,
    name,
    code,
    description,
    organizationId,
    organization,
    createdAt,
    createdByUserId,
    updatedAt,
    updatedByUserId,
    isActive,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
