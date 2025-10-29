# UpdateProfileRequest

プロフィール更新リクエスト

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**username** | **string** | ユーザー名 | [optional] [default to undefined]
**avatarType** | **string** | アバタータイプ | [optional] [default to undefined]
**avatarUrl** | **string** | アバターURL | [optional] [default to undefined]
**skillIds** | **Array&lt;number&gt;** | スキルIDリスト | [optional] [default to undefined]

## Example

```typescript
import { UpdateProfileRequest } from './api';

const instance: UpdateProfileRequest = {
    username,
    avatarType,
    avatarUrl,
    skillIds,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
