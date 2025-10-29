# WorkspaceItemDetailResponse

ワークスペースアイテム詳細レスポンス

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | アイテムID | [optional] [default to undefined]
**workspaceId** | **number** | ワークスペースID | [optional] [default to undefined]
**workspaceName** | **string** | ワークスペース名 | [optional] [default to undefined]
**code** | **string** | コード | [optional] [default to undefined]
**subject** | **string** | 件名 | [optional] [default to undefined]
**body** | **string** | 本文 | [optional] [default to undefined]
**ownerId** | **number** | オーナーユーザーID | [optional] [default to undefined]
**ownerUsername** | **string** | オーナーユーザー名 | [optional] [default to undefined]
**ownerAvatarUrl** | **string** | オーナーアバターURL | [optional] [default to undefined]
**assigneeId** | **number** | 作業中のユーザーID | [optional] [default to undefined]
**assigneeUsername** | **string** | 作業中のユーザー名 | [optional] [default to undefined]
**assigneeAvatarUrl** | **string** | 作業中のユーザーアバターURL | [optional] [default to undefined]
**priority** | **number** | 重要度（1: 低、2: 普通、3: 高） | [optional] [default to undefined]
**dueDate** | **string** | 期限日 | [optional] [default to undefined]
**isArchived** | **boolean** | アーカイブフラグ | [optional] [default to undefined]
**isDraft** | **boolean** | 下書き中フラグ | [optional] [default to undefined]
**committerId** | **number** | コミッターユーザーID | [optional] [default to undefined]
**committerUsername** | **string** | コミッターユーザー名 | [optional] [default to undefined]
**committerAvatarUrl** | **string** | コミッターアバターURL | [optional] [default to undefined]
**createdAt** | **string** | 作成日時 | [optional] [default to undefined]
**updatedAt** | **string** | 更新日時 | [optional] [default to undefined]
**tags** | [**Array&lt;TagInfoResponse&gt;**](TagInfoResponse.md) | タグのリスト | [optional] [default to undefined]
**isPinned** | **boolean** | ログイン中のユーザーがこのアイテムをPINしているか | [optional] [default to undefined]
**pinCount** | **number** | このアイテムのPIN総数 | [optional] [default to undefined]

## Example

```typescript
import { WorkspaceItemDetailResponse } from './api';

const instance: WorkspaceItemDetailResponse = {
    id,
    workspaceId,
    workspaceName,
    code,
    subject,
    body,
    ownerId,
    ownerUsername,
    ownerAvatarUrl,
    assigneeId,
    assigneeUsername,
    assigneeAvatarUrl,
    priority,
    dueDate,
    isArchived,
    isDraft,
    committerId,
    committerUsername,
    committerAvatarUrl,
    createdAt,
    updatedAt,
    tags,
    isPinned,
    pinCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
